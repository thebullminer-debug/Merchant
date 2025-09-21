import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  Plugin,
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import type { MedianPrice } from "@shared/schema";

// OHLCV candle data types (stock exchange format)
interface CandleData {
  t: number;  // timestamp (Unix)
  o: number;  // open price
  h: number;  // high price
  l: number;  // low price
  c: number;  // close price
  v: number;  // volume
  quality: 'observed' | 'interpolated';
  observedCount: number;
  interpolatedCount: number;
}

interface CandleMetadata {
  spanDays: number;
  availableRanges: string[];
  earliest: string;
  latest: string;
  interval: string;
  includeEstimates: boolean;
}

interface CandleSeries {
  data: CandleData[];
  metadata: CandleMetadata;
}

// Vertical crosshair plugin
const crosshairPlugin: Plugin<'line'> = {
  id: 'crosshair',
  afterDraw: (chart) => {
    if (chart.tooltip?.opacity && chart.tooltip.dataPoints?.length > 0) {
      const ctx = chart.ctx;
      const x = chart.tooltip.caretX;
      const topY = chart.chartArea.top;
      const bottomY = chart.chartArea.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'hsl(217, 91%, 60%)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
  }
};

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  crosshairPlugin
);

interface PriceChartProps {
  collectibleId: string;
  collectibleName: string;
}

// Stock exchange standard time intervals 
const timeRanges = [
  { label: "1D", interval: "1d", days: 1 },
  { label: "7D", interval: "1d", days: 7 },
  { label: "1M", interval: "1d", days: 30 },
  { label: "3M", interval: "1d", days: 90 },
  { label: "6M", interval: "1d", days: 180 },
  { label: "YTD", interval: "1d", days: 366 },
  { label: "1Y", interval: "1d", days: 365 },
  { label: "5Y", interval: "1d", days: 1825 },
  { label: "ALL", interval: "1d", days: 999 },
];

export function PriceChart({ collectibleId, collectibleName }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState(999);
  const [selectedRangeLabel, setSelectedRangeLabel] = useState('ALL');
  const [includeEstimates, setIncludeEstimates] = useState(false); // Default to only real recorded prices
  const [forceLineMode, setForceLineMode] = useState(false); // User can override auto scatter mode

  // Use the new OHLCV candles endpoint - stock exchange quality
  const { data: candleData, isLoading } = useQuery<CandleSeries>({
    queryKey: ["/api/collectibles", collectibleId, "prices/candles", selectedRangeLabel, includeEstimates],
    queryFn: async () => {
      const selectedTimeRange = timeRanges.find(r => r.label === selectedRangeLabel);
      const params = new URLSearchParams({
        interval: selectedTimeRange?.interval || '1d',
        range: selectedRangeLabel,
        includeEstimates: includeEstimates.toString(),
      });
      
      const response = await fetch(`/api/collectibles/${collectibleId}/prices/candles?${params}`);
      if (!response.ok) throw new Error("Failed to fetch candle data");
      return response.json();
    },
    enabled: !!collectibleId,
  });
  
  // Extract OHLCV candle data - use close prices for line chart
  const priceData = candleData?.data?.map(candle => ({
    date: new Date(candle.t * 1000).toISOString(), // Convert Unix timestamp to ISO
    value: candle.c, // Use close price for chart
    quality: candle.quality
  })) || [];

  // Smart fallback: Auto-select best available range when current selection isn't available
  useEffect(() => {
    if (candleData?.metadata?.availableRanges) {
      const availableRanges = candleData.metadata.availableRanges;
      const currentRangeAvailable = availableRanges.includes(selectedRangeLabel);
      
      if (!currentRangeAvailable) {
        // Priority order: prefer longer time periods first, then ALL as fallback
        const priorityOrder = ['5Y', '1Y', 'YTD', '6M', '3M', '1M', '7D', '1D', 'ALL'];
        const bestAvailable = priorityOrder.find(range => availableRanges.includes(range)) || availableRanges[0];
        
        if (bestAvailable) {
          const targetRange = timeRanges.find(r => r.label === bestAvailable);
          if (targetRange) {
            setSelectedRange(targetRange.days);
            setSelectedRangeLabel(targetRange.label);
          }
        }
      }
    }
  }, [candleData?.metadata?.availableRanges, selectedRangeLabel]);

  const { data: currentPrice } = useQuery<{ price: number; change: number; activeListings: number }>({
    queryKey: ["/api/collectibles", collectibleId, "current-price"],
    enabled: !!collectibleId,
  });

  // Gap-aware rendering logic
  const calculateGapThreshold = (selectedRange: number): number => {
    // Define maximum acceptable gap as a fraction of the total timeframe
    const timeframeDays = selectedRange === 999 ? 365 * 10 : selectedRange; // ALL = 10 years default
    
    if (timeframeDays >= 1825) return 180; // 5Y: 6 months gap
    if (timeframeDays >= 365) return 90;   // 1Y, YTD: 3 months gap
    if (timeframeDays >= 180) return 60;   // 6M: 2 months gap
    if (timeframeDays >= 90) return 30;    // 3M: 1 month gap
    if (timeframeDays >= 30) return 7;     // 1M: 1 week gap
    if (timeframeDays >= 7) return 2;      // 7D: 2 days gap
    return 1; // 1D: 1 day gap
  };

  const addGapBreaks = (data: { x: Date; y: number }[], gapThresholdDays: number) => {
    if (data.length < 2) return data;
    
    const result: ({ x: Date; y: number } | { x: Date; y: null })[] = [];
    const gapThresholdMs = gapThresholdDays * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < data.length; i++) {
      result.push(data[i]);
      
      // Check gap to next point
      if (i < data.length - 1) {
        const currentTime = data[i].x.getTime();
        const nextTime = data[i + 1].x.getTime();
        const gap = nextTime - currentTime;
        
        // If gap exceeds threshold, add null point to break the line
        if (gap > gapThresholdMs) {
          result.push({
            x: new Date(currentTime + gap / 2), // Midpoint of gap
            y: null
          });
        }
      }
    }
    
    return result;
  };

  // Convert data to time series format for TimeScale
  const baseTimeSeriesData = priceData
    .map((item) => ({
      x: new Date(item.date),
      y: Number(item.value)
    }))
    .sort((a, b) => a.x.getTime() - b.x.getTime()); // Ensure ascending date order

  // Use base data directly - connect all points with gold line
  const timeSeriesData = baseTimeSeriesData;

  // Scatter mode detection for sparse data
  const detectSparseData = (data: any[], timeframeMs: number): boolean => {
    if (data.length <= 3) return true; // Very few points
    
    // Calculate point density (points per day)
    const pointsPerDay = data.length / (timeframeMs / (24 * 60 * 60 * 1000));
    
    // Use scatter mode if density is very low
    if (selectedRange >= 1825) return pointsPerDay < 0.1;  // 5Y: < 1 point per 10 days
    if (selectedRange >= 365) return pointsPerDay < 0.2;   // 1Y, YTD: < 1 point per 5 days
    if (selectedRange >= 180) return pointsPerDay < 0.3;   // 6M: < 1 point per 3 days
    if (selectedRange >= 90) return pointsPerDay < 0.5;    // 3M: < 1 point per 2 days
    if (selectedRange >= 30) return pointsPerDay < 1.0;    // 1M: < 1 point per day
    if (selectedRange >= 7) return pointsPerDay < 4.0;     // 7D: < 1 point per 6 hours
    return pointsPerDay < 48.0; // 1D: < 1 point per 30 minutes
  };

  // Always use line mode to connect all price points
  const shouldUseScatterMode = false;

  // Create density rug plot - tick marks at the bottom for each observed data point
  const rugPlotData = baseTimeSeriesData.map(point => ({
    x: point.x,
    y: 0 // Bottom of chart
  }));

  const chartData = {
    datasets: [
      {
        label: "Median Price",
        data: timeSeriesData,
        borderColor: "hsl(45, 100%, 50%)", // Gold line
        backgroundColor: "hsla(45, 100%, 50%, 0.1)", // Light gold fill
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "hsl(45, 100%, 50%)", // Gold points
        pointBorderColor: "hsl(210, 40%, 98%)",
        pointBorderWidth: 2,
        showLine: true, // Always show connecting lines
        spanGaps: true, // Connect all points with gold line
        yAxisID: 'y',
      },
      // Density rug plot - shows where actual data points exist
      {
        label: "Data Points",
        data: rugPlotData,
        borderColor: "hsl(217, 91%, 60%)",
        backgroundColor: "hsl(217, 91%, 60%)",
        borderWidth: 0,
        pointRadius: 1.5,
        pointHoverRadius: 3,
        pointStyle: 'rect', // Small rectangles for rug plot
        showLine: false,
        fill: false,
        yAxisID: 'rugAxis',
        pointBackgroundColor: "hsl(217, 91%, 60%)",
        pointBorderColor: "hsl(217, 91%, 60%)",
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "hsl(214, 32%, 12%)",
        titleColor: "hsl(210, 40%, 98%)",
        bodyColor: "hsl(210, 40%, 98%)",
        borderColor: "hsl(214, 32%, 20%)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => {
            // Handle null values from gap breaks
            if (!Number.isFinite(context.parsed.y)) {
              return 'Data gap - no price recorded';
            }
            return `Price: $${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: (() => {
            if (selectedRange === 999) return 'year'; // ALL: 5 year intervals
            if (selectedRange >= 1825) return 'year'; // 5Y: 1 year apart
            if (selectedRange >= 365) return 'month'; // 1Y, YTD: monthly
            if (selectedRange >= 180) return 'month'; // 6M: monthly
            if (selectedRange >= 90) return 'day'; // 3M: 3 days apart
            if (selectedRange >= 30) return 'day'; // 1M: daily
            if (selectedRange >= 7) return 'hour'; // 7D: 6 hours apart
            return 'minute'; // 1D: 30 minutes apart
          })(),
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MMM dd HH:mm',
            day: 'MMM dd',
            month: 'MMM yyyy',
            year: 'yyyy'
          }
        },
        grid: {
          color: "hsl(214, 32%, 20%)",
        },
        ticks: {
          color: "hsl(215, 20%, 65%)",
          font: {
            size: 12,
          },
          stepSize: (() => {
            if (selectedRange === 999) return 5; // ALL: 5 year intervals
            if (selectedRange >= 1825) return 1; // 5Y: 1 year apart
            if (selectedRange >= 365) return 1; // 1Y, YTD: 1 month apart
            if (selectedRange >= 180) return 1; // 6M: 1 month apart
            if (selectedRange >= 90) return 3; // 3M: 3 days apart
            if (selectedRange >= 30) return 1; // 1M: 1 day apart
            if (selectedRange >= 7) return 6; // 7D: 6 hours apart
            return 30; // 1D: 30 minutes apart
          })(),
        },
      },
      y: {
        grid: {
          color: "hsl(214, 32%, 20%)",
        },
        ticks: {
          color: "hsl(215, 20%, 65%)",
          font: {
            size: 12,
          },
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
      },
      // Hidden axis for rug plot positioning
      rugAxis: {
        type: 'linear' as const,
        position: 'left' as const,
        display: false, // Hidden axis
        min: 0,
        max: 1,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-foreground">{collectibleName} - Price Chart</CardTitle>
        {currentPrice && (
          <div className="flex items-center space-x-4 text-sm">
            <span className="font-bold text-foreground text-lg">
              ${currentPrice.price.toLocaleString()}
            </span>
            <span className={`flex items-center ${currentPrice.change >= 0 ? 'price-positive' : 'price-negative'}`}>
              {currentPrice.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">
                {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(2)}%
              </span>
            </span>
            <span className="text-muted-foreground">
              {currentPrice.activeListings} listings
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Data Quality and Controls */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {timeRanges
              .filter(range => 
                // Show range if it's available in metadata, or if no metadata yet (loading state)
                !candleData?.metadata || candleData.metadata.availableRanges.includes(range.label)
              )
              .map((range) => (
                <Button
                  key={range.label}
                  variant={selectedRange === range.days ? "default" : "secondary"}
                  size="sm"
                  onClick={() => {
                    setSelectedRange(range.days);
                    setSelectedRangeLabel(range.label);
                  }}
                  data-testid={`time-range-${range.label}`}
                >
                  {range.label}
                </Button>
              ))}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Data Quality Badge */}
            {candleData?.metadata && (
              <div className="flex items-center gap-2">
                <Info size={16} className="text-muted-foreground" />
                <Badge variant="outline">
                  {candleData.metadata.spanDays} day span available
                </Badge>
              </div>
            )}
            
            {/* Real Prices vs Estimates Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground cursor-pointer" htmlFor="estimates-toggle">
                Show Interpolated Data
              </label>
              <Switch
                id="estimates-toggle"
                checked={includeEstimates}
                onCheckedChange={setIncludeEstimates}
                data-testid="estimates-toggle"
              />
            </div>
            
            {/* Scatter vs Line Mode Toggle */}
            {shouldUseScatterMode && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground cursor-pointer" htmlFor="line-mode-toggle">
                  Connect Points
                </label>
                <Switch
                  id="line-mode-toggle"
                  checked={forceLineMode}
                  onCheckedChange={setForceLineMode}
                  data-testid="line-mode-toggle"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="loading-shimmer h-full w-full rounded"></div>
            </div>
          ) : priceData.length > 0 ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p>No price data available</p>
                <p className="text-sm mt-1">Check back later for updates</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
