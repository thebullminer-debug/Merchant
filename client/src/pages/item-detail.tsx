import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceChart } from "@/components/price-chart";
import { Star, Heart, Share2, ExternalLink, Calendar, Tag } from "lucide-react";
import type { Collectible } from "@shared/schema";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: collectible, isLoading, error } = useQuery<Collectible>({
    queryKey: ["/api/collectibles", id],
    enabled: !!id,
  });

  const { data: currentPrice } = useQuery<{ price: number; change: number; activeListings: number }>({
    queryKey: ["/api/collectibles", id, "current-price"],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="loading-shimmer h-96 w-full rounded-xl mb-6"></div>
          </div>
          <div className="space-y-6">
            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <div className="loading-shimmer h-8 w-3/4 mb-4 rounded"></div>
                <div className="loading-shimmer h-4 w-1/2 mb-4 rounded"></div>
                <div className="loading-shimmer h-6 w-1/3 mb-2 rounded"></div>
                <div className="loading-shimmer h-4 w-1/4 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (error || !collectible) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-foreground mb-4">Item Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The collectible item you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild data-testid="button-back-home">
            <a href="/">Return Home</a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Chart */}
        <div className="lg:col-span-2">
          <PriceChart collectibleId={collectible.id} collectibleName={collectible.name} />
        </div>

        {/* Sidebar - Item Details */}
        <div className="space-y-6">
          {/* Item Image and Basic Info */}
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              {collectible.imageUrl ? (
                <img
                  src={collectible.imageUrl}
                  alt={collectible.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  data-testid="item-image"
                />
              ) : (
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="item-title">
                {collectible.name}
              </h1>
              
              {collectible.description && (
                <p className="text-muted-foreground mb-4" data-testid="item-description">
                  {collectible.description}
                </p>
              )}

              {/* Price Information */}
              {currentPrice && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Median:</span>
                    <span className="font-bold text-foreground text-lg" data-testid="current-price">
                      ${currentPrice.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Change:</span>
                    <span 
                      className={`font-bold ${currentPrice.change >= 0 ? 'price-positive' : 'price-negative'}`}
                      data-testid="price-change"
                    >
                      {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Listings:</span>
                    <span className="text-foreground" data-testid="active-listings">
                      {currentPrice.activeListings}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 mb-6">
                <Button className="flex-1" data-testid="button-add-watchlist">
                  <Heart className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </Button>
                <Button variant="outline" size="icon" data-testid="button-share">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Item Metadata */}
              <div className="space-y-3 border-t border-border pt-4">
                {collectible.brand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="text-foreground font-medium" data-testid="item-brand">
                      {collectible.brand}
                    </span>
                  </div>
                )}
                
                {collectible.model && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="text-foreground" data-testid="item-model">
                      {collectible.model}
                    </span>
                  </div>
                )}

                {collectible.year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="text-foreground" data-testid="item-year">
                      {collectible.year}
                    </span>
                  </div>
                )}

                {collectible.condition && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition:</span>
                    <Badge variant="secondary" data-testid="item-condition">
                      {collectible.condition}
                    </Badge>
                  </div>
                )}

                {collectible.tags && collectible.tags.length > 0 && (
                  <div>
                    <span className="text-muted-foreground mb-2 block">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {collectible.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs" data-testid={`tag-${index}`}>
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Added:</span>
                  <span className="text-muted-foreground" data-testid="item-created">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(collectible.createdAt!).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Sources */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg">Price Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">eBay</span>
                  <Button variant="ghost" size="sm" data-testid="button-view-ebay">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">TCGPlayer</span>
                  <Button variant="ghost" size="sm" data-testid="button-view-tcgplayer">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Discogs</span>
                  <Button variant="ghost" size="sm" data-testid="button-view-discogs">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
