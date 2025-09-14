import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceChart } from "@/components/price-chart";
import { Star, Heart, Share2, ExternalLink, Calendar, Tag, TrendingUp, TrendingDown, Eye, Clock, DollarSign } from "lucide-react";
import { useState } from "react";
import type { Collectible } from "@shared/schema";

interface ItemDetails extends Collectible {
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  activeListings?: number;
  avgPrice30d?: number;
  avgPrice90d?: number;
  priceHistory?: Array<{
    date: string;
    price: number;
  }>;
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const { data: collectible, isLoading, error } = useQuery<ItemDetails>({
    queryKey: ["/api/collectibles", id],
    enabled: !!id,
  });

  const { data: currentPrice } = useQuery<{ price: number; change: number; activeListings: number }>({
    queryKey: ["/api/collectibles", id, "current-price"],
    enabled: !!id,
  });

  const handleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    // TODO: Implement actual watchlist API call
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: collectible?.name,
          text: `Check out this ${collectible?.name} on Merchant`,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // Show a toast or notification that URL was copied
        console.log("URL copied to clipboard");
      }
    } catch (error) {
      // Final fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        console.log("URL copied to clipboard");
      } catch (clipboardError) {
        console.error("Failed to copy URL:", clipboardError);
      }
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="loading-shimmer h-96 w-full rounded-xl"></div>
            <div className="loading-shimmer h-64 w-full rounded-xl"></div>
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Price History</CardTitle>
                <div className="flex items-center space-x-2">
                  {collectible.priceChange !== undefined && (
                    <Badge 
                      variant={collectible.priceChange >= 0 ? "default" : "destructive"}
                      className="flex items-center gap-1"
                    >
                      {collectible.priceChange >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {collectible.priceChange >= 0 ? '+' : ''}{collectible.priceChange?.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PriceChart collectibleId={collectible.id} collectibleName={collectible.name} />
            </CardContent>
          </Card>

          {/* Item Details Tabs */}
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="market">Market Data</TabsTrigger>
                  <TabsTrigger value="listings">Active Listings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Brand</label>
                      <p className="text-foreground">{collectible.brand || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Model</label>
                      <p className="text-foreground">{collectible.model || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Year</label>
                      <p className="text-foreground">{collectible.year || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Condition</label>
                      <p className="text-foreground">{collectible.condition || "Not specified"}</p>
                    </div>
                  </div>
                  {collectible.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="text-foreground mt-1">{collectible.description}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="market" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">30-Day Average</p>
                      <p className="text-lg font-bold">
                        {collectible.avgPrice30d ? `$${collectible.avgPrice30d.toLocaleString()}` : "N/A"}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">90-Day Average</p>
                      <p className="text-lg font-bold">
                        {collectible.avgPrice90d ? `$${collectible.avgPrice90d.toLocaleString()}` : "N/A"}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Eye className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Active Listings</p>
                      <p className="text-lg font-bold">{collectible.activeListings || 0}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="listings" className="mt-6">
                  <div className="text-center py-8">
                    <ExternalLink className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">View Live Listings</h3>
                    <p className="text-muted-foreground mb-4">
                      See current marketplace listings for this item
                    </p>
                    <Button variant="outline" asChild>
                      <a href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(collectible.name)}`} target="_blank" rel="noopener noreferrer">
                        View on eBay
                      </a>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Item Image and Basic Info */}
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              {collectible.imageUrl ? (
                <img
                  src={collectible.imageUrl}
                  alt={collectible.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="item-title">
                {collectible.name}
              </h1>
              
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="secondary">{collectible.brand}</Badge>
                {collectible.year && <Badge variant="outline">{collectible.year}</Badge>}
              </div>

              <div className="text-center py-4 border-t border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Current Market Price</p>
                <p className="text-3xl font-bold text-primary" data-testid="current-price">
                  {currentPrice ? `$${currentPrice.price.toLocaleString()}` : "Price unavailable"}
                </p>
                {currentPrice && (
                  <p className={`text-sm flex items-center justify-center gap-1 ${
                    currentPrice.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {currentPrice.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(1)}% (24h)
                  </p>
                )}
              </div>

              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={handleWatchlist}
                  variant={isWatchlisted ? "default" : "outline"}
                  className="flex-1"
                  data-testid="button-watchlist"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isWatchlisted ? 'fill-current' : ''}`} />
                  {isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}
                </Button>
                <Button 
                  onClick={handleShare}
                  variant="outline"
                  size="icon"
                  data-testid="button-share"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{collectible.categoryId || "General"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added</span>
                <span className="font-medium">{new Date(collectible.createdAt!).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">{new Date(collectible.updatedAt!).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Price Alert */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Price Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get notified when the price drops below your target
              </p>
              <Button variant="outline" className="w-full" data-testid="button-set-alert">
                Set Price Alert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}