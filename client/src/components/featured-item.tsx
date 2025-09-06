import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Heart, ExternalLink } from "lucide-react";
import { PriceChart } from "./price-chart";
import { useLocation } from "wouter";
import type { Collectible } from "@shared/schema";

interface FeaturedItemProps {
  collectibleId: string;
}

export function FeaturedItem({ collectibleId }: FeaturedItemProps) {
  const [, setLocation] = useLocation();

  const { data: collectible, isLoading: collectibleLoading } = useQuery<Collectible>({
    queryKey: ["/api/collectibles", collectibleId],
    enabled: !!collectibleId,
  });

  const { data: currentPrice, isLoading: priceLoading } = useQuery<{ price: number; change: number; activeListings: number }>({
    queryKey: ["/api/collectibles", collectibleId, "current-price"],
    enabled: !!collectibleId,
  });

  if (collectibleLoading || !collectible) {
    return (
      <section className="mb-12">
        <Card className="bg-card border border-border overflow-hidden">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="loading-shimmer h-96 w-full rounded-xl"></div>
              <div className="space-y-4">
                <div className="loading-shimmer h-8 w-3/4 rounded"></div>
                <div className="loading-shimmer h-6 w-1/2 rounded"></div>
                <div className="loading-shimmer h-80 w-full rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Featured Collectible</h2>
        <p className="text-muted-foreground">Track this item's market performance</p>
      </div>
      
      <Card className="bg-card border border-border overflow-hidden">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Image and Details */}
            <div className="space-y-6">
              {collectible.imageUrl ? (
                <img
                  src={collectible.imageUrl}
                  alt={collectible.name}
                  className="w-full h-80 object-cover rounded-xl shadow-lg"
                  data-testid="featured-item-image"
                />
              ) : (
                <div className="w-full h-80 bg-muted rounded-xl flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2" data-testid="featured-item-name">
                    {collectible.name}
                  </h3>
                  {collectible.description && (
                    <p className="text-muted-foreground" data-testid="featured-item-description">
                      {collectible.description}
                    </p>
                  )}
                </div>

                {/* Price Information */}
                {currentPrice && !priceLoading && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current Median Price</span>
                      <span className="text-2xl font-bold text-foreground" data-testid="featured-current-price">
                        ${currentPrice.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">24h Change</span>
                      <span 
                        className={`font-bold flex items-center ${currentPrice.change >= 0 ? 'price-positive' : 'price-negative'}`}
                        data-testid="featured-price-change"
                      >
                        {currentPrice.change >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                        {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active Listings</span>
                      <span className="text-foreground" data-testid="featured-active-listings">
                        {currentPrice.activeListings}
                      </span>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-2">
                  {collectible.brand && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <Badge variant="secondary" data-testid="featured-brand">{collectible.brand}</Badge>
                    </div>
                  )}
                  {collectible.model && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="text-foreground" data-testid="featured-model">{collectible.model}</span>
                    </div>
                  )}
                  {collectible.condition && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Condition:</span>
                      <Badge variant="outline" data-testid="featured-condition">{collectible.condition}</Badge>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button 
                    className="flex-1" 
                    onClick={() => setLocation(`/item/${collectible.id}`)}
                    data-testid="button-view-details"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full Details
                  </Button>
                  <Button variant="outline" size="icon" data-testid="button-add-to-watchlist">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side - Price Chart */}
            <div className="flex flex-col">
              <div className="flex-1">
                <PriceChart 
                  collectibleId={collectible.id} 
                  collectibleName={collectible.name}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}