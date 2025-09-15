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

  // Convert data to time series format for TimeScale
  const timeSeriesData = priceData.map((item) => ({
    x: new Date(item.date),
    y: Number(item.value)
  }));

  const chartData = {
    datasets: [
      {
        label: "Median Price",
        data: timeSeriesData,
        borderColor: "hsl(217, 91%, 60%)",
        backgroundColor: "hsla(217, 91%, 60%, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "hsl(217, 91%, 60%)",
        pointBorderColor: "hsl(210, 40%, 98%)",
        pointBorderWidth: 2,
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
