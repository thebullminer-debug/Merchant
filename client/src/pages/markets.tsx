import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/search-bar";
import { Watch, Zap, Disc, Coins, Trophy, Car, Shield, Palette, TrendingUp, TrendingDown, BarChart3, Star, Search, Filter, SlidersHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import type { Category, Collectible } from "@shared/schema";

interface MarketData extends Collectible {
  currentPrice?: number;
  priceChange?: number;
  marketCap?: number;
  volume24h?: number;
  activeListings?: number;
}

const categoryImages = {
  "Watches": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
  "Trading Cards": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
  "Vinyl Records": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
  "Coins": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
  "Sports Collectibles": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
  "Collector Cars": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
  "Military": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
  "Art": "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
};

const categoryIcons = {
  "Watches": Watch,
  "Trading Cards": Zap,
  "Vinyl Records": Disc,
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
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Get search query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q') || '';

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Query for search results when there's a search query
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<MarketData[]>({
    queryKey: ["/api/collectibles/search", searchQuery, selectedCategory, sortBy],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const params = new URLSearchParams({
        q: searchQuery,
        ...(selectedCategory && { categoryId: selectedCategory }),
        sort: sortBy,
      });
      
      const response = await fetch(`/api/collectibles/search?${params}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: !!searchQuery,
  });

  // Query for category-based collectibles when no search query but category is selected
  const { data: categoryResults = [], isLoading: categoryLoading } = useQuery<MarketData[]>({
    queryKey: ["/api/collectibles", selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      
      const response = await fetch(`/api/collectibles?categoryId=${selectedCategory}`);
      if (!response.ok) throw new Error("Failed to fetch category items");
      return response.json();
    },
    enabled: !!selectedCategory && !searchQuery,
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
    enabled: !searchQuery, // Only fetch market data when not searching
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleItemClick = (item: MarketData) => {
    setLocation(`/item/${item.id}`);
  };

  // Determine which results to show and filter them
  const currentResults = searchQuery ? searchResults : 
                        selectedCategory ? categoryResults : marketData;
  const currentLoading = searchQuery ? searchLoading : 
                        selectedCategory ? categoryLoading : isLoading;
  
  const filteredResults = currentResults.filter(item => {
    if (priceRange === "all") return true;
    const price = item.currentPrice || 0;
    
    switch (priceRange) {
      case "under-100": return price < 100;
      case "100-1000": return price >= 100 && price < 1000;
      case "1000-10000": return price >= 1000 && price < 10000;
      case "over-10000": return price >= 10000;
      default: return true;
    }
  });

  const showCategoryResults = selectedCategory && !searchQuery;
  const showSearchResults = searchQuery;
  const showCategoryGrid = !searchQuery && !selectedCategory;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <section className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Collectibles
              <span className="text-primary"> Markets</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {searchQuery ? 'Search results and market data' : 'Explore market trends and pricing data across all collectible categories'}
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              <SearchBar />
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <Card className="max-w-4xl mx-auto">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price Range</label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Prices</SelectItem>
                          <SelectItem value="under-100">Under $100</SelectItem>
                          <SelectItem value="100-1000">$100 - $1,000</SelectItem>
                          <SelectItem value="1000-10000">$1,000 - $10,000</SelectItem>
                          <SelectItem value="over-10000">Over $10,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort By */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sort By</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market-cap">Market Cap</SelectItem>
                          <SelectItem value="volume">24h Volume</SelectItem>
                          <SelectItem value="price-change">Price Change</SelectItem>
                          <SelectItem value="alphabetical">Alphabetical</SelectItem>
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="trending">Most Popular</SelectItem>
                          <SelectItem value="newest">Newest First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Search Results */}
        {(searchQuery || showCategoryResults) && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {searchQuery ? "Search Results" : selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name || 'Category'} Market` : "Market Data"}
                </h2>
                <p className="text-muted-foreground">
                  {currentLoading ? "Loading..." : 
                    searchQuery ? `${filteredResults.length} results for "${searchQuery}"` :
                    selectedCategory ? `Live pricing and market data for ${categories.find(c => c.id === selectedCategory)?.name?.toLowerCase()}` :
                    `${filteredResults.length} items`
                  }
                </p>
              </div>
              {selectedCategory && (
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCategory(null)}
                  data-testid="button-clear-category"
                >
                  Show All Categories
                </Button>
              )}
            </div>

            {currentLoading ? (
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
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredResults.map((item, index) => (
                  <Card
                    key={`${item.id}-${index}`}
                    className="bg-card border border-border card-hover cursor-pointer transition-all duration-200"
                    onClick={() => handleItemClick(item)}
                    data-testid={`search-result-${item.id}`}
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
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {item.brand} {item.model && `• ${item.model}`}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground">
                          {item.currentPrice ? `$${item.currentPrice.toLocaleString()}` : "Price unavailable"}
                        </span>
                        {item.priceChange !== undefined && (
                          <span className={`text-sm flex items-center ${item.priceChange >= 0 ? 'price-positive' : 'price-negative'}`}>
                            {item.priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span className="ml-1">
                              {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.activeListings || 0} active listings
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Category Overview Grid - Show when no search query and no category selected */}
        {showCategoryGrid && (
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
        )}

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