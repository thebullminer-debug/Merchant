import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MarketStats {
  totalItems: number;
  totalValue: string;
  activeListings: number;
}

export function MarketStats() {
  const { data: stats, isLoading } = useQuery<MarketStats>({
    queryKey: ["/api/market/stats"],
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="bg-card border border-border">
              <CardContent className="p-6 text-center">
                <div className="loading-shimmer h-8 w-24 mx-auto mb-2 rounded"></div>
                <div className="loading-shimmer h-4 w-20 mx-auto mb-1 rounded"></div>
                <div className="loading-shimmer h-3 w-16 mx-auto rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="mb-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load market statistics at this time.</p>
        </div>
      </section>
    );
  }

  const formatValue = (value: string) => {
    const num = Number(value);
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(1)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(1)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border border-border">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-2" data-testid="stat-total-items">
              {stats.totalItems.toLocaleString()}
            </div>
            <div className="text-muted-foreground">Items Tracked</div>
            <div className="text-sm price-positive mt-1 flex items-center justify-center">
              <TrendingUp size={14} className="mr-1" />
              Growing daily
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-2" data-testid="stat-total-value">
              {formatValue(stats.totalValue)}
            </div>
            <div className="text-muted-foreground">Total Market Value</div>
            <div className="text-sm price-positive mt-1 flex items-center justify-center">
              <TrendingUp size={14} className="mr-1" />
              Market growth
            </div>
          </CardContent>
        </Card>

      </div>
    </section>
  );
}
