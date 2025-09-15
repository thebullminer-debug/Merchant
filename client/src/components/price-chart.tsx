import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import type { MedianPrice } from "@shared/schema";

// New types for resampled data
interface ResampledPoint {
  date: string;
  value: number;
  quality: 'observed' | 'interpolated' | 'aggregated';
}

interface ResamplingMetadata {
  observedCount: number;
  interpolatedCount: number;
  earliestObserved: string;
  latestObserved: string;
}

interface ResampledSeries {
  data: ResampledPoint[];
  metadata: ResamplingMetadata;
}

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  collectibleId: string;
  collectibleName: string;
}

const timeRanges = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
  { label: "5Y", days: 1825 },
  { label: "10Y", days: 3650 },
  { label: "ALL", days: 999 },
];

export function PriceChart({ collectibleId, collectibleName }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState(999);
  const [includeEstimates, setIncludeEstimates] = useState(false); // Default to only real recorded prices
  const [forceLineMode, setForceLineMode] = useState(false); // User can override auto scatter mode

  // Use the new resampled endpoint
  const { data: resampledData, isLoading } = useQuery<ResampledSeries>({
    queryKey: ["/api/collectibles", collectibleId, "prices/resampled", selectedRange, includeEstimates],
    queryFn: async () => {
      const response = await fetch(`/api/collectibles/${collectibleId}/prices/resampled?days=${selectedRange}&includeEstimates=${includeEstimates}`);
      if (!response.ok) throw new Error("Failed to fetch resampled price data");
      return response.json();
    },
    enabled: !!collectibleId,
  });
  
  // Extract price data from resampled response
  const priceData = resampledData?.data || [];

  const { data: currentPrice } = useQuery<{ price: number; change: number; activeListings: number }>({
    queryKey: ["/api/collectibles", collectibleId, "current-price"],
    enabled: !!collectibleId,
  });

  // Gap-aware rendering logic
  const calculateGapThreshold = (selectedRange: number): number => {
    // Define maximum acceptable gap as a fraction of the total timeframe
    const timeframeDays = selectedRange === 999 ? 365 * 10 : selectedRange; // ALL = 10 years default
    
    if (timeframeDays >= 3650) return 365; // 10Y: 1 year gap
    if (timeframeDays >= 1825) return 180; // 5Y: 6 months gap
    if (timeframeDays >= 365) return 90;   // 1Y: 3 months gap
    if (timeframeDays >= 90) return 30;    // 3M: 1 month gap
    if (timeframeDays >= 30) return 7;     // 1M: 1 week gap
    return 3; // Short timeframes: 3 days gap
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

  // Apply gap-aware rendering
  const gapThreshold = calculateGapThreshold(selectedRange);
  const timeSeriesData = addGapBreaks(baseTimeSeriesData, gapThreshold);

  // Scatter mode detection for sparse data
  const detectSparseData = (data: any[], timeframeMs: number): boolean => {
    if (data.length <= 3) return true; // Very few points
    
    // Calculate point density (points per day)
    const pointsPerDay = data.length / (timeframeMs / (24 * 60 * 60 * 1000));
    
    // Use scatter mode if density is very low
    if (selectedRange >= 3650) return pointsPerDay < 0.05; // 10Y: < 1 point per 20 days
    if (selectedRange >= 1825) return pointsPerDay < 0.1;  // 5Y: < 1 point per 10 days
    if (selectedRange >= 365) return pointsPerDay < 0.2;   // 1Y: < 1 point per 5 days
    if (selectedRange >= 90) return pointsPerDay < 0.5;    // 3M: < 1 point per 2 days
    return pointsPerDay < 1.0; // Shorter ranges: < 1 point per day
  };

  const timeframeMs = selectedRange === 999 ? 365 * 10 * 24 * 60 * 60 * 1000 : selectedRange * 24 * 60 * 60 * 1000;
  const shouldUseScatterMode = !forceLineMode && detectSparseData(baseTimeSeriesData, timeframeMs);

  const chartData = {
    datasets: [
      {
        label: "Median Price",
        data: timeSeriesData,
        borderColor: "hsl(217, 91%, 60%)",
        backgroundColor: "hsla(217, 91%, 60%, 0.1)",
        borderWidth: shouldUseScatterMode ? 0 : 2,
        fill: shouldUseScatterMode ? false : true,
        tension: 0.1,
        pointRadius: shouldUseScatterMode ? 6 : 3,
        pointHoverRadius: shouldUseScatterMode ? 8 : 6,
        pointBackgroundColor: "hsl(217, 91%, 60%)",
        pointBorderColor: "hsl(210, 40%, 98%)",
        pointBorderWidth: 2,
        showLine: !shouldUseScatterMode, // Hide line in scatter mode
        spanGaps: false, // Don't connect across null values (gaps)
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
          unit: selectedRange >= 3650 ? 'year' : 
                selectedRange >= 365 ? 'month' : 
                selectedRange >= 30 ? 'week' : 'day',
          displayFormats: {
            day: 'MMM dd',
            week: 'MMM dd', 
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
            {timeRanges.map((range) => (
              <Button
                key={range.label}
                variant={selectedRange === range.days ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedRange(range.days)}
                data-testid={`time-range-${range.label}`}
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Data Quality Badge */}
            {resampledData?.metadata && (
              <div className="flex items-center gap-2">
                <Info size={16} className="text-muted-foreground" />
                <Badge variant="outline">
                  {resampledData.metadata.observedCount} observed, {resampledData.metadata.interpolatedCount} estimated
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
