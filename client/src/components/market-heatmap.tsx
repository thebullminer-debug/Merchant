import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface HeatmapItem {
  id: string;
  name: string;
  category: string;
  change: number;
  value: number;
  volume: number;
}

interface MarketHeatmapProps {
  data: HeatmapItem[];
  title?: string;
}

export function MarketHeatmap({ data, title = "Market Heatmap" }: MarketHeatmapProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Sort data by absolute change for better visual representation
  const sortedData = [...data].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Calculate size based on market value
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));

  const getItemSize = (value: number) => {
    const normalizedSize = ((value - minValue) / (maxValue - minValue)) * 100 + 50;
    return Math.max(normalizedSize, 60); // Minimum size of 60px
  };

  const getColorIntensity = (change: number) => {
    const maxChange = Math.max(...data.map(item => Math.abs(item.change)));
    const intensity = Math.abs(change) / maxChange;
    return Math.max(intensity, 0.2); // Minimum opacity of 20%
  };

  const getItemStyle = (item: HeatmapItem) => {
    const size = getItemSize(item.value);
    const intensity = getColorIntensity(item.change);
    
    const baseColor = item.change >= 0 
      ? `hsl(var(--chart-2))` // Green
      : `hsl(var(--destructive))`; // Red
    
    return {
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: item.change >= 0 
        ? `hsla(var(--chart-2), ${intensity})`
        : `hsla(var(--destructive), ${intensity})`,
      border: hoveredItem === item.id ? `2px solid ${baseColor}` : '1px solid hsl(var(--border))',
      transform: hoveredItem === item.id ? 'scale(1.05)' : 'scale(1)',
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="outline" className="text-xs">
            {data.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center">
          {sortedData.map((item) => (
            <div
              key={item.id}
              className="relative flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
              style={getItemStyle(item)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              data-testid={`heatmap-item-${item.id}`}
            >
              <div className="text-center p-2">
                <div className="text-xs font-semibold text-foreground truncate max-w-[80px]">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.category}
                </div>
                <div className={`text-xs font-bold flex items-center gap-1 justify-center ${
                  item.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                </div>
              </div>
              
              {/* Tooltip on hover */}
              {hoveredItem === item.id && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-popover border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
                  <div className="text-sm font-semibold text-popover-foreground">
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {item.category}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Value:</span>
                      <span className="font-medium">${item.value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span className={`font-medium ${
                        item.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume:</span>
                      <span className="font-medium">{item.volume.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No market data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}