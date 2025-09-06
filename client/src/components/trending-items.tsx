import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import type { Collectible } from "@shared/schema";

interface TrendingItem extends Collectible {
  priceChange?: number;
  currentPrice?: number;
  activeListings?: number;
}

export function TrendingItems() {
  const [, setLocation] = useLocation();

  const { data: trendingItems = [], isLoading } = useQuery<TrendingItem[]>({
    queryKey: ["/api/collectibles/trending"],
    staleTime: 300000, // 5 minutes
  });

  const handleItemClick = (item: TrendingItem) => {
    setLocation(`/item/${item.id}`);
  };

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Trending Collectibles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="bg-card border border-border">
              <CardContent className="p-4">
                <div className="loading-shimmer h-40 w-full rounded-lg mb-3"></div>
                <div className="loading-shimmer h-4 w-3/4 rounded mb-1"></div>
                <div className="loading-shimmer h-3 w-1/2 rounded mb-2"></div>
                <div className="flex justify-between items-center">
                  <div className="loading-shimmer h-4 w-16 rounded"></div>
                  <div className="loading-shimmer h-3 w-12 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Trending Collectibles</h2>
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary/80 font-medium transition-colors"
          onClick={() => setLocation("/trending")}
          data-testid="button-view-all-trending"
        >
          View All <ArrowRight className="ml-1" size={16} />
        </Button>
      </div>

      {trendingItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No trending items available at the moment.</p>
          <p className="text-sm text-muted-foreground mt-1">Check back later for updates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingItems.map((item) => (
            <Card
              key={item.id}
              className="bg-card border border-border card-hover cursor-pointer"
              onClick={() => handleItemClick(item)}
              data-testid={`trending-item-${item.id}`}
            >
              <CardContent className="p-4">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="rounded-lg w-full h-40 object-cover mb-3"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="bg-muted rounded-lg w-full h-40 flex items-center justify-center mb-3">
                    <span className="text-muted-foreground text-sm">No image</span>
                  </div>
                )}
                <h3 className="font-semibold text-foreground mb-1 line-clamp-2" data-testid={`item-name-${item.id}`}>
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1" data-testid={`item-condition-${item.id}`}>
                  {item.condition || "Condition not specified"}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground" data-testid={`item-price-${item.id}`}>
                    {item.currentPrice ? `$${item.currentPrice.toLocaleString()}` : "Price unavailable"}
                  </span>
                  {item.priceChange !== undefined && (
                    <span className={`text-sm flex items-center ${item.priceChange >= 0 ? 'price-positive' : 'price-negative'}`}>
                      {item.priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="ml-1" data-testid={`item-change-${item.id}`}>
                        {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                      </span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1" data-testid={`item-listings-${item.id}`}>
                  {item.activeListings || 0} active listings
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
