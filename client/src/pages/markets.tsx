import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CreditCard, Disc3, Coins, Trophy, Car, Shield, Palette, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import type { Category, Collectible } from "@shared/schema";

interface MarketData extends Collectible {
  currentPrice?: number;
  priceChange?: number;
  marketCap?: number;
  volume24h?: number;
}

const categoryIcons = {
  "Watches": Clock,
  "Trading Cards": CreditCard,
  "Vinyl Records": Disc3,
  "Coins": Coins,
  "Sports Collectibles": Trophy,
  "Collector Cars": Car,
  "Military Items": Shield,
  "Art": Palette,
};

export function MarketsPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("market-cap");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: marketData = [], isLoading } = useQuery<MarketData[]>({
    queryKey: ["/api/markets", selectedCategory, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(selectedCategory && { category: selectedCategory }),
        sort: sortBy,
      });
      
      const response = await fetch(`/api/markets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch market data");
      return response.json();
    },
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleItemClick = (item: MarketData) => {
    setLocation(`/item/${item.id}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Collectibles
            <span className="text-primary"> Markets</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore market trends and pricing data across all collectible categories
          </p>
        </section>

        {/* Category Overview Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market-cap">Market Cap</SelectItem>
                  <SelectItem value="volume">24h Volume</SelectItem>
                  <SelectItem value="price-change">Price Change</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || BarChart3;
              const categoryItems = marketData.filter(item => item.categoryId === category.id);
              const totalValue = categoryItems.reduce((sum, item) => sum + (item.currentPrice || 0), 0);
              const avgChange = categoryItems.length > 0 
                ? categoryItems.reduce((sum, item) => sum + (item.priceChange || 0), 0) / categoryItems.length 
                : 0;

              return (
                <Card
                  key={`${category.id}-${index}`}
                  className="bg-card border border-border card-hover cursor-pointer transition-all duration-200"
                  onClick={() => handleCategorySelect(category.id)}
                  data-testid={`category-card-${category.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </div>
                      {avgChange !== 0 && (
                        <Badge 
                          variant={avgChange >= 0 ? "default" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {avgChange >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-semibold">{categoryItems.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Value</p>
                        <p className="font-semibold">
                          {totalValue > 0 ? `$${(totalValue / 1000).toFixed(0)}K` : "N/A"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description || `Explore ${category.name.toLowerCase()} with real-time pricing and market trends`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Market Data Table */}
        {selectedCategory && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {categories.find(c => c.id === selectedCategory)?.name} Market
                </h2>
                <p className="text-muted-foreground">
                  Live pricing and market data for {categories.find(c => c.id === selectedCategory)?.name?.toLowerCase()}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory(null)}
                data-testid="button-clear-category"
              >
                Show All Categories
              </Button>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                        <div className="flex items-center space-x-4">
                          <div className="loading-shimmer w-12 h-12 rounded-lg"></div>
                          <div>
                            <div className="loading-shimmer h-4 w-32 rounded mb-1"></div>
                            <div className="loading-shimmer h-3 w-20 rounded"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="loading-shimmer h-4 w-20 rounded mb-1"></div>
                          <div className="loading-shimmer h-3 w-12 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  {marketData.filter(item => item.categoryId === selectedCategory).length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No items in this category</h3>
                      <p className="text-muted-foreground">Check back later for new additions</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {marketData
                        .filter(item => item.categoryId === selectedCategory)
                        .map((item, index) => (
                          <div
                            key={`${item.id}-${index}`}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleItemClick(item)}
                            data-testid={`market-item-${item.id}`}
                          >
                            <div className="flex items-center space-x-4">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground">No img</span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-foreground">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.brand} {item.model && `• ${item.model}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                {item.currentPrice ? `$${item.currentPrice.toLocaleString()}` : "N/A"}
                              </p>
                              {item.priceChange !== undefined && (
                                <p className={`text-sm flex items-center justify-end gap-1 ${
                                  item.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {item.priceChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        )}
      </div>
    </main>
  );
}