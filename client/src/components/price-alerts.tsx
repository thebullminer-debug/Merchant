import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceAlert {
  id: string;
  name: string;
  change: number;
  currentPrice: number;
  time: string;
}

export function PriceAlerts() {
  const { data: alerts = [], isLoading } = useQuery<PriceAlert[]>({
    queryKey: ["/api/price-alerts"],
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Recent Price Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="loading-shimmer w-2 h-2 rounded-full"></div>
                    <div>
                      <div className="loading-shimmer h-4 w-32 rounded mb-1"></div>
                      <div className="loading-shimmer h-3 w-16 rounded"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="loading-shimmer h-4 w-16 rounded mb-1"></div>
                    <div className="loading-shimmer h-3 w-12 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Recent Price Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No significant price movements to report.</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for updates.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => {
                const isPositive = alert.change >= 0;
                const changeAmount = (alert.currentPrice * Math.abs(alert.change)) / 100;
                
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                    data-testid={`price-alert-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          isPositive ? 'bg-chart-1' : 'bg-chart-2'
                        }`}
                      ></div>
                      <div>
                        <div className="font-medium text-foreground" data-testid={`alert-name-${index}`}>
                          {alert.name}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`alert-time-${index}`}>
                          {alert.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold flex items-center ${isPositive ? 'price-positive' : 'price-negative'}`}>
                        {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                        <span data-testid={`alert-change-amount-${index}`}>
                          {isPositive ? '+' : '-'}${changeAmount.toFixed(0)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`alert-change-percent-${index}`}>
                        {isPositive ? '+' : ''}{alert.change.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
