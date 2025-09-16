import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/search-bar";
import { MarketStats } from "@/components/market-stats";
import { TrendingItems } from "@/components/trending-items";
import { PriceChart } from "@/components/price-chart";
import { Watch, Zap, Disc, Coins, Trophy, Car, Shield, Palette, TrendingUp, TrendingDown, BarChart3, Star, Search, Filter, SlidersHorizontal, Activity, Eye, Bell } from "lucide-react";
import { useLocation } from "wouter";
import type { Category, Collectible, MarketAnalytics } from "@shared/schema";

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
  const [timeframe, setTimeframe] = useState("1M");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

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

  // Analytics data query for Trading Cards dashboard
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<MarketAnalytics>({
    queryKey: ["/api/analytics/market", selectedCategory, timeframe],
    queryFn: async () => {
      if (!selectedCategory) throw new Error("Category ID required");
      
      const params = new URLSearchParams({
        categoryId: selectedCategory,
        period: timeframe,
        limit: "10"
      });
      
      const response = await fetch(`/api/analytics/market?${params}`);
      if (!response.ok) throw new Error("Failed to fetch analytics data");
      return response.json();
    },
    enabled: !!selectedCategory && !searchQuery,
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
              {searchQuery ? 'Search results and market data' : selectedCategory ? `Market trends and pricing data for ${categories.find(c => c.id === selectedCategory)?.name || 'selected category'}` : 'Choose a category to explore market trends and pricing data'}
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
        {searchQuery && (
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

        {/* Browse by Category - Show when no search query and no category selected */}
        {showCategoryGrid && (
          <section className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">Browse by Category</h2>
              <p className="text-muted-foreground">Explore collectibles across different categories</p>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="bg-card border border-border">
                    <CardContent className="p-6">
                      <div className="loading-shimmer h-12 w-12 rounded-lg mb-4"></div>
                      <div className="loading-shimmer h-6 w-3/4 rounded mb-2"></div>
                      <div className="loading-shimmer h-4 w-1/2 rounded mb-4"></div>
                      <div className="space-y-2">
                        <div className="loading-shimmer h-3 w-full rounded"></div>
                        <div className="loading-shimmer h-3 w-2/3 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((category) => {
                  const Icon = categoryIcons[category.name as keyof typeof categoryIcons] || Star;
                  const categoryItems = marketData.filter(item => item.categoryId === category.id);
                  const itemCount = categoryItems.length;
                  const avgPrice = categoryItems.length > 0 
                    ? categoryItems.reduce((sum, item) => sum + (item.currentPrice || 0), 0) / categoryItems.length
                    : 0;
                  const avgPriceChange = categoryItems.length > 0
                    ? categoryItems.reduce((sum, item) => sum + (item.priceChange || 0), 0) / categoryItems.length
                    : 0;
                  const imageUrl = categoryImages[category.name as keyof typeof categoryImages];
                  
                  return (
                    <Card
                      key={category.id}
                      className="bg-card border border-border card-hover cursor-pointer transition-all duration-200 group"
                      onClick={() => handleCategorySelect(category.id)}
                      data-testid={`category-card-${category.id}`}
                    >
                      <CardContent className="p-6">
                        {/* Category Image */}
                        <div className="relative mb-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={category.name}
                              className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                              <Icon className="w-12 h-12 text-primary" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <div className="w-8 h-8 bg-background/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Category Info */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {category.description || `Explore ${category.name.toLowerCase()} market data`}
                            </p>
                          </div>
                          
                          {/* Stats */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Items:</span>
                              <span className="font-medium text-foreground">{itemCount.toLocaleString()}</span>
                            </div>
                            
                            {avgPrice > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Avg Price:</span>
                                <span className="font-medium text-foreground">${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                            )}
                            
                            {avgPriceChange !== 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Trend:</span>
                                <span className={`font-medium flex items-center ${
                                  avgPriceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {avgPriceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                  <span className="ml-1">
                                    {avgPriceChange >= 0 ? '+' : ''}{avgPriceChange.toFixed(1)}%
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Button */}
                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategorySelect(category.id);
                              }}
                            >
                              Explore {category.name}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {!isLoading && categories.length === 0 && (
              <div className="text-center py-12">
                <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No categories available</h3>
                <p className="text-muted-foreground">Categories will appear here when data is available</p>
              </div>
            )}
          </section>
        )}

        {/* Category-specific view - Show when a category is selected but no search query */}
        {showCategoryResults && (
          <section className="space-y-8">
            {/* Top Performers Section */}
            <div className="space-y-4">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Top Performers
                  </CardTitle>
                  <p className="text-muted-foreground">Best performing items by volume and price change</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryResults
                      .filter(item => item.priceChange && item.priceChange > 0)
                      .sort((a, b) => (b.priceChange || 0) - (a.priceChange || 0))
                      .slice(0, 6)
                      .map((item, index) => (
                        <div
                          key={`top-performer-${item.id}-${index}`}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => handleItemClick(item)}
                          data-testid={`top-performer-${item.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.brand || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              ${item.currentPrice?.toLocaleString() || '0'}
                            </p>
                            <span className="text-green-600 dark:text-green-400 text-xs flex items-center">
                              <TrendingUp size={10} className="mr-1" />
                              +{item.priceChange?.toFixed(1) || '0'}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {categoryResults.filter(item => item.priceChange && item.priceChange > 0).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No top performers available at this time
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Gainers Section */}
            <div className="space-y-4">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    Top Gainers
                  </CardTitle>
                  <p className="text-muted-foreground">Biggest price increases in 1M</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryResults
                      .filter(item => item.priceChange && item.priceChange > 0)
                      .sort((a, b) => (b.priceChange || 0) - (a.priceChange || 0))
                      .slice(0, 6)
                      .map((item, index) => (
                        <div
                          key={`top-gainer-${item.id}-${index}`}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
                          onClick={() => handleItemClick(item)}
                          data-testid={`category-top-gainer-${item.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.brand || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              ${item.currentPrice?.toLocaleString() || '0'}
                            </p>
                            <span className="text-green-600 dark:text-green-400 text-xs flex items-center">
                              <TrendingUp size={10} className="mr-1" />
                              +{item.priceChange?.toFixed(1) || '0'}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {categoryResults.filter(item => item.priceChange && item.priceChange > 0).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No gainers in this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Losers Section */}
            <div className="space-y-4">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                    Top Losers
                  </CardTitle>
                  <p className="text-muted-foreground">Biggest price decreases in 1M</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryResults
                      .filter(item => item.priceChange && item.priceChange < 0)
                      .sort((a, b) => (a.priceChange || 0) - (b.priceChange || 0))
                      .slice(0, 6)
                      .map((item, index) => (
                        <div
                          key={`top-loser-${item.id}-${index}`}
                          className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                          onClick={() => handleItemClick(item)}
                          data-testid={`category-top-loser-${item.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.brand || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              ${item.currentPrice?.toLocaleString() || '0'}
                            </p>
                            <span className="text-red-600 dark:text-red-400 text-xs flex items-center">
                              <TrendingDown size={10} className="mr-1" />
                              {item.priceChange?.toFixed(1) || '0'}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {categoryResults.filter(item => item.priceChange && item.priceChange < 0).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No losers in this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sports Cards Section */}
            <div className="space-y-4">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    Sports Cards
                  </CardTitle>
                  <p className="text-muted-foreground">List Sports cards items we advertise</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryResults
                      .filter(item => {
                        const sportsCategory = categories.find(cat => cat.name.toLowerCase().includes('sports') || cat.name.toLowerCase().includes('trading'));
                        return sportsCategory && item.categoryId === sportsCategory.id;
                      })
                      .slice(0, 8)
                      .map((item, index) => (
                        <Card
                          key={`sports-card-${item.id}-${index}`}
                          className="bg-card border border-border card-hover cursor-pointer transition-all duration-200"
                          onClick={() => handleItemClick(item)}
                          data-testid={`category-sports-card-${item.id}`}
                        >
                          <CardContent className="p-4">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="rounded-lg w-full h-32 object-cover mb-3"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="bg-muted rounded-lg w-full h-32 flex items-center justify-center mb-3">
                                <span className="text-muted-foreground text-sm">No image</span>
                              </div>
                            )}
                            <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-sm">
                              {item.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                              {item.brand}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-foreground text-sm">
                                ${item.currentPrice?.toLocaleString() || '0'}
                              </span>
                              {item.priceChange !== undefined && (
                                <span className={`text-xs flex items-center ${item.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {item.priceChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  <span className="ml-1">
                                    {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                                  </span>
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  {categoryResults.filter(item => {
                    const sportsCategory = categories.find(cat => cat.name.toLowerCase().includes('sports') || cat.name.toLowerCase().includes('trading'));
                    return sportsCategory && item.categoryId === sportsCategory.id;
                  }).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No sports cards available at this time
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pokemon Cards Section */}
            <div className="space-y-4">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    Pokemon Cards
                  </CardTitle>
                  <p className="text-muted-foreground">List Pokemon cards items we advertise</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryResults
                      .filter(item => item.name.toLowerCase().includes('pokemon') || item.brand?.toLowerCase().includes('pokemon'))
                      .slice(0, 8)
                      .map((item, index) => (
                        <Card
                          key={`pokemon-card-${item.id}-${index}`}
                          className="bg-card border border-border card-hover cursor-pointer transition-all duration-200"
                          onClick={() => handleItemClick(item)}
                          data-testid={`category-pokemon-card-${item.id}`}
                        >
                          <CardContent className="p-4">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="rounded-lg w-full h-32 object-cover mb-3"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="bg-muted rounded-lg w-full h-32 flex items-center justify-center mb-3">
                                <span className="text-muted-foreground text-sm">No image</span>
                              </div>
                            )}
                            <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-sm">
                              {item.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                              {item.brand}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-foreground text-sm">
                                ${item.currentPrice?.toLocaleString() || '0'}
                              </span>
                              {item.priceChange !== undefined && (
                                <span className={`text-xs flex items-center ${item.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {item.priceChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  <span className="ml-1">
                                    {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                                  </span>
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  {categoryResults.filter(item => item.name.toLowerCase().includes('pokemon') || item.brand?.toLowerCase().includes('pokemon')).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No Pokemon cards available at this time
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Magic Cards Section */}
            <div className="space-y-4">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    Magic Cards
                  </CardTitle>
                  <p className="text-muted-foreground">List Magic cards items we advertise</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryResults
                      .filter(item => item.name.toLowerCase().includes('magic') || item.brand?.toLowerCase().includes('magic') || item.name.toLowerCase().includes('mtg'))
                      .slice(0, 8)
                      .map((item, index) => (
                        <Card
                          key={`magic-card-${item.id}-${index}`}
                          className="bg-card border border-border card-hover cursor-pointer transition-all duration-200"
                          onClick={() => handleItemClick(item)}
                          data-testid={`category-magic-card-${item.id}`}
                        >
                          <CardContent className="p-4">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="rounded-lg w-full h-32 object-cover mb-3"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="bg-muted rounded-lg w-full h-32 flex items-center justify-center mb-3">
                                <span className="text-muted-foreground text-sm">No image</span>
                              </div>
                            )}
                            <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-sm">
                              {item.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                              {item.brand}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-foreground text-sm">
                                ${item.currentPrice?.toLocaleString() || '0'}
                              </span>
                              {item.priceChange !== undefined && (
                                <span className={`text-xs flex items-center ${item.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {item.priceChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  <span className="ml-1">
                                    {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                                  </span>
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  {categoryResults.filter(item => item.name.toLowerCase().includes('magic') || item.brand?.toLowerCase().includes('magic') || item.name.toLowerCase().includes('mtg')).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No Magic cards available at this time
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Category Markets Dashboard - Shows when a category is selected but not searching */}
        {selectedCategory && !searchQuery && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {categories.find(c => c.id === selectedCategory)?.name} Markets
                </h2>
                <p className="text-muted-foreground">
                  Market trends and pricing data for {categories.find(c => c.id === selectedCategory)?.name?.toLowerCase()}
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

            {/* Top Performers Section */}
            <div className="space-y-4">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Top Performers
                  </CardTitle>
                  <p className="text-muted-foreground">Best performing items by volume and price change</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryResults
                      .filter(item => item.priceChange && item.priceChange > 0)
                      .sort((a, b) => (b.priceChange || 0) - (a.priceChange || 0))
                      .slice(0, 6)
                      .map((item, index) => (
                        <div
                          key={`category-top-performer-${item.id}-${index}`}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => handleItemClick(item)}
                          data-testid={`category-top-performer-${item.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.brand || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              ${item.currentPrice?.toLocaleString() || '0'}
                            </p>
                            <span className="text-green-600 dark:text-green-400 text-xs flex items-center">
                              <TrendingUp size={10} className="mr-1" />
                              +{item.priceChange?.toFixed(1) || '0'}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {categoryResults.filter(item => item.priceChange && item.priceChange > 0).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No top performers available at this time
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}