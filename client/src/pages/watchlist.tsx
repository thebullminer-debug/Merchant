import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, TrendingUp, TrendingDown, X, Bell, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import type { Collectible } from "@shared/schema";

interface WatchlistItem extends Collectible {
  currentPrice?: number;
  priceChange?: number;
  lastAlert?: string;
  addedAt: string;
}

export function WatchlistPage() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const queryClient = useQueryClient();

  const { data: watchlistItems = [], isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
    queryFn: async () => {
      const response = await fetch("/api/watchlist");
      if (!response.ok) throw new Error("Failed to fetch watchlist");
      
      const watchlist = await response.json();
      
      // Mock enhanced watchlist data with collectible details
      const mockWatchlistItems: WatchlistItem[] = [
        {
          id: "30ede095-8a47-43d4-9178-88509239a07a",
          name: "Rolex Submariner Date",
          description: "",
          brand: "Rolex",
          model: "Submariner 126610LN",
          year: 2023,
          condition: "Excellent",
          imageUrl: "https://media.rolex.com/image/upload/q_auto:eco/f_auto/t_v7/c_limit,w_800/v1/catalogue/2025/bezel-constant-size-with-shadow/m126610ln-0001.jpg",
          categoryId: "watches",
          tags: [],
          metadata: {},
          currentPrice: 12850,
          priceChange: 2.3,
          lastAlert: "2 hours ago",
          addedAt: "2024-01-15",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "dcbce0d4-1ffb-4dd0-8d32-20cd81095a21",
          name: "Charizard Base Set 1st Edition",
          description: "",
          brand: "Pokemon",
          model: "Base Set",
          year: 1998,
          condition: "PSA 10",
          imageUrl: "https://static.tcgplayer.com/product-images/pokemon-tcg/base-set/4-charizard-holo.jpg",
          categoryId: "trading-cards",
          tags: [],
          metadata: {},
          currentPrice: 8750,
          priceChange: -1.2,
          lastAlert: "1 day ago",
          addedAt: "2024-01-10",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "ebdc1951-1758-4436-bad9-c0eb7e63d67c",
          name: "The Beatles - Abbey Road",
          description: "",
          brand: "The Beatles",
          model: "Abbey Road",
          year: 1969,
          condition: "VG+",
          imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg",
          categoryId: "vinyl-records",
          tags: [],
          metadata: {},
          currentPrice: 450,
          priceChange: 5.7,
          lastAlert: "Never",
          addedAt: "2024-01-08",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      return mockWatchlistItems;
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (collectibleId: string) => {
      const response = await fetch(`/api/watchlist/${collectibleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Failed to remove from watchlist");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const handleRemoveFromWatchlist = (collectibleId: string) => {
    removeFromWatchlistMutation.mutate(collectibleId);
  };

  const handleItemClick = (item: WatchlistItem) => {
    setLocation(`/item/${item.id}`);
  };

  const filteredItems = watchlistItems.filter(item => {
    if (filterBy === "all") return true;
    if (filterBy === "gainers") return (item.priceChange || 0) > 0;
    if (filterBy === "losers") return (item.priceChange || 0) < 0;
    if (filterBy === "alerts") return item.lastAlert !== "Never";
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case "price-high":
        return (b.currentPrice || 0) - (a.currentPrice || 0);
      case "price-low":
        return (a.currentPrice || 0) - (b.currentPrice || 0);
      case "change-high":
        return (b.priceChange || 0) - (a.priceChange || 0);
      case "change-low":
        return (a.priceChange || 0) - (b.priceChange || 0);
      default:
        return 0;
    }
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                My
                <span className="text-primary"> Watchlist</span>
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Track your favorite collectibles and get price alerts
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2" data-testid="button-manage-alerts">
                <Bell className="w-4 h-4" />
                Manage Alerts
              </Button>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="gainers">Price Gainers</SelectItem>
                  <SelectItem value="losers">Price Losers</SelectItem>
                  <SelectItem value="alerts">With Alerts</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="change-high">Biggest Gainers</SelectItem>
                  <SelectItem value="change-low">Biggest Losers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              {watchlistItems.length} items in watchlist
            </div>
          </div>
        </section>

        {/* Watchlist Items */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="bg-card border border-border">
                  <CardContent className="p-6">
                    <div className="loading-shimmer h-40 w-full rounded-lg mb-4"></div>
                    <div className="loading-shimmer h-6 w-3/4 rounded mb-2"></div>
                    <div className="loading-shimmer h-4 w-1/2 rounded mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="loading-shimmer h-6 w-20 rounded"></div>
                      <div className="loading-shimmer h-4 w-12 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-4">Your watchlist is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start building your collection by adding items you're interested in tracking
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild data-testid="button-browse-markets">
                  <a href="/markets">Browse Markets</a>
                </Button>
                <Button variant="outline" asChild data-testid="button-search-items">
                  <a href="/search">Search Items</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedItems.map((item, index) => (
                <Card
                  key={`${item.id}-${index}`}
                  className="bg-card border border-border card-hover cursor-pointer transition-all duration-200 relative group"
                >
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromWatchlist(item.id);
                    }}
                    disabled={removeFromWatchlistMutation.isPending}
                    data-testid={`button-remove-${item.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  <div onClick={() => handleItemClick(item)}>
                    <CardContent className="p-6">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-4">
                          <span className="text-muted-foreground text-sm">No image</span>
                        </div>
                      )}

                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {item.name}
                      </h3>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">{item.brand}</Badge>
                        {item.condition && (
                          <Badge variant="outline" className="text-xs">
                            {item.condition}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Current Price</span>
                          <span className="font-bold text-foreground">
                            {item.currentPrice ? `$${item.currentPrice.toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                        
                        {item.priceChange !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">24h Change</span>
                            <span className={`text-sm flex items-center gap-1 ${
                              item.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {item.priceChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Last Alert</span>
                          <span className="text-xs text-muted-foreground">{item.lastAlert}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                        <Heart className="w-4 h-4 fill-current text-primary" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        {sortedItems.length > 0 && (
          <section className="border-t border-border pt-8">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Looking for more collectibles?</h3>
              <div className="flex gap-4 justify-center">
                <Button asChild data-testid="button-browse-categories">
                  <a href="/markets">Browse Categories</a>
                </Button>
                <Button variant="outline" asChild data-testid="button-search-new">
                  <a href="/search">Search for Items</a>
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
