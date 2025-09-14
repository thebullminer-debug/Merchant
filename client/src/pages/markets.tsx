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

        {/* Category Analytics Panel - Shows when a category is selected but not searching */}
        {selectedCategory && !searchQuery && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {categories.find(c => c.id === selectedCategory)?.name} Analytics
                </h2>
                <p className="text-muted-foreground">
                  Market insights and performance data for {categories.find(c => c.id === selectedCategory)?.name?.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Trading Cards specific timeframe selector */}
                {categories.find(c => c.id === selectedCategory)?.name === 'Trading Cards' && (
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1D">1D</SelectItem>
                      <SelectItem value="7D">7D</SelectItem>
                      <SelectItem value="1M">1M</SelectItem>
                      <SelectItem value="3M">3M</SelectItem>
                      <SelectItem value="1Y">1Y</SelectItem>
                      <SelectItem value="5Y">5Y</SelectItem>
                      <SelectItem value="10Y">10Y</SelectItem>
                      <SelectItem value="ALL">ALL</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCategory(null)}
                  data-testid="button-clear-category"
                >
                  Show All Categories
                </Button>
              </div>
            </div>

            {/* Trading Cards Dashboard or Basic KPI Stats */}
            {categories.find(c => c.id === selectedCategory)?.name === 'Trading Cards' && analyticsData ? (
              <>
                {/* Subcategory Filters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Subcategories</h3>
                  <div className="space-y-3">
                    {/* Brands */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Brands</h4>
                      <div className="flex flex-wrap gap-2">
                        {analyticsData.subcategories.brands.slice(0, 10).map((brand) => (
                          <Badge 
                            key={brand.name} 
                            variant={selectedSubcategory === brand.name ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedSubcategory(selectedSubcategory === brand.name ? null : brand.name)}
                            data-testid={`brand-filter-${brand.name}`}
                          >
                            {brand.name} ({brand.count})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Sports */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Sports</h4>
                      <div className="flex flex-wrap gap-2">
                        {analyticsData.subcategories.sports.slice(0, 8).map((sport) => (
                          <Badge 
                            key={sport.name} 
                            variant={selectedSubcategory === sport.name ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedSubcategory(selectedSubcategory === sport.name ? null : sport.name)}
                            data-testid={`sport-filter-${sport.name}`}
                          >
                            {sport.name} ({sport.count})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Eras */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Eras</h4>
                      <div className="flex flex-wrap gap-2">
                        {analyticsData.subcategories.eras.map((era) => (
                          <Badge 
                            key={era.name} 
                            variant={selectedSubcategory === era.name ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedSubcategory(selectedSubcategory === era.name ? null : era.name)}
                            data-testid={`era-filter-${era.name}`}
                          >
                            {era.name} ({era.count}) - {era.range}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Dashboard - Three columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top Performers */}
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Star className="w-5 h-5 text-yellow-600" />
                        Top Performers
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Best performing cards by volume & growth</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analyticsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-3">
                            <div className="loading-shimmer h-4 w-32 rounded"></div>
                            <div className="loading-shimmer h-4 w-16 rounded"></div>
                          </div>
                        ))
                      ) : analyticsData.topPerformers.length > 0 ? (
                        analyticsData.topPerformers.map((item, index) => (
                          <div
                            key={`performer-${item.id}-${index}`}
                            className="flex items-center justify-between py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setLocation(`/item/${item.id}`)}
                            data-testid={`top-performer-${item.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-foreground truncate">{item.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{item.brand || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{item.activeListings} active</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-sm">
                                ${item.currentPrice.toLocaleString()}
                              </p>
                              <div className={`text-xs flex items-center justify-end ${
                                item.percentageChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {item.percentageChange >= 0 ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                )}
                                {item.percentageChange >= 0 ? '+' : ''}{item.percentageChange.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">No top performers data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Gainers */}
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Top Gainers
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Biggest price increases in {timeframe}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analyticsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-3">
                            <div className="loading-shimmer h-4 w-32 rounded"></div>
                            <div className="loading-shimmer h-4 w-16 rounded"></div>
                          </div>
                        ))
                      ) : analyticsData.topGainers.length > 0 ? (
                        analyticsData.topGainers.map((item, index) => (
                          <div
                            key={`gainer-${item.id}-${index}`}
                            className="flex items-center justify-between py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setLocation(`/item/${item.id}`)}
                            data-testid={`top-gainer-${item.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-foreground truncate">{item.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{item.brand || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{item.activeListings} active</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-sm">
                                ${item.currentPrice.toLocaleString()}
                              </p>
                              <div className="text-green-600 dark:text-green-400 text-xs flex items-center justify-end">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                +{item.percentageChange.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">No gainers data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Losers */}
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        Top Losers
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Biggest price decreases in {timeframe}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analyticsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-3">
                            <div className="loading-shimmer h-4 w-32 rounded"></div>
                            <div className="loading-shimmer h-4 w-16 rounded"></div>
                          </div>
                        ))
                      ) : analyticsData.topLosers.length > 0 ? (
                        analyticsData.topLosers.map((item, index) => (
                          <div
                            key={`loser-${item.id}-${index}`}
                            className="flex items-center justify-between py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setLocation(`/item/${item.id}`)}
                            data-testid={`top-loser-${item.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-foreground truncate">{item.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{item.brand || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{item.activeListings} active</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-sm">
                                ${item.currentPrice.toLocaleString()}
                              </p>
                              <div className="text-red-600 dark:text-red-400 text-xs flex items-center justify-end">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                {item.percentageChange.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">No losers data available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              /* Basic KPI Stats for non-Trading Cards categories */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-card border border-border">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-foreground mb-2" data-testid="kpi-items">
                      {categoryResults.length}
                    </div>
                    <div className="text-muted-foreground text-sm">Items Available</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center">
                      <Activity size={12} className="mr-1" />
                      Active market
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-foreground mb-2" data-testid="kpi-avg-price">
                      {categoryResults.length > 0 
                        ? `$${Math.round(categoryResults.reduce((sum, item) => sum + (item.currentPrice || 0), 0) / categoryResults.length).toLocaleString()}`
                        : 'N/A'}
                    </div>
                    <div className="text-muted-foreground text-sm">Avg. Price</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Median value
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-foreground mb-2" data-testid="kpi-avg-change">
                      {categoryResults.length > 0 
                        ? `${(categoryResults.reduce((sum, item) => sum + (item.priceChange || 0), 0) / categoryResults.length).toFixed(1)}%`
                        : 'N/A'}
                    </div>
                    <div className="text-muted-foreground text-sm">Avg. Change</div>
                    <div className={`text-xs mt-1 flex items-center justify-center ${
                      categoryResults.length > 0 && (categoryResults.reduce((sum, item) => sum + (item.priceChange || 0), 0) / categoryResults.length) >= 0
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {categoryResults.length > 0 && (categoryResults.reduce((sum, item) => sum + (item.priceChange || 0), 0) / categoryResults.length) >= 0 
                        ? <TrendingUp size={12} className="mr-1" />
                        : <TrendingDown size={12} className="mr-1" />
                      }
                      24h trend
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-foreground mb-2" data-testid="kpi-active-listings">
                      {categoryResults.reduce((sum, item) => sum + (item.activeListings || 0), 0)}
                    </div>
                    <div className="text-muted-foreground text-sm">Active Listings</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center justify-center">
                      <Eye size={12} className="mr-1" />
                      Live market
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analytics Dashboard - Show detailed analytics when category selected */}
            {selectedCategory && analyticsData && !analyticsLoading && (
              <div className="space-y-6">
                {/* Subcategory Filters */}
                {analyticsData.subcategories && (
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary" />
                        Category Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Brands */}
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-3">Top Brands</h4>
                          <div className="space-y-2">
                            {analyticsData.subcategories.brands.slice(0, 5).map((brand, index) => (
                              <div key={`brand-${index}`} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{brand.name}</span>
                                <Badge variant="secondary" className="text-xs">{brand.count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sports */}
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-3">Sports</h4>
                          <div className="space-y-2">
                            {analyticsData.subcategories.sports.slice(0, 5).map((sport, index) => (
                              <div key={`sport-${index}`} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{sport.name}</span>
                                <Badge variant="secondary" className="text-xs">{sport.count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Eras */}
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-3">Eras</h4>
                          <div className="space-y-2">
                            {analyticsData.subcategories.eras.slice(0, 5).map((era, index) => (
                              <div key={`era-${index}`} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{era.name}</span>
                                <Badge variant="secondary" className="text-xs">{era.count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Analytics Sections - Top Performers, Gainers, Losers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top Performers */}
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        Top Performers
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Best performing items by volume and price change
                      </p>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.topPerformers.length > 0 ? (
                        analyticsData.topPerformers.slice(0, 5).map((item, index) => (
                          <div
                            key={`performer-${item.id}-${index}`}
                            className="flex items-center justify-between py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setLocation(`/item/${item.id}`)}
                            data-testid={`top-performer-${item.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <Star size={16} className="text-yellow-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">{item.brand || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">
                                ${item.currentPrice.toLocaleString()}
                              </p>
                              <span className={`text-xs flex items-center ${
                                item.percentageChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {item.percentageChange >= 0 ? 
                                  <TrendingUp size={10} className="mr-1" /> : 
                                  <TrendingDown size={10} className="mr-1" />
                                }
                                {item.percentageChange >= 0 ? '+' : ''}{item.percentageChange.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No performance data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Gainers */}
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Top Gainers
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Biggest price increases in {timeframe}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.topGainers.length > 0 ? (
                        analyticsData.topGainers.slice(0, 5).map((item, index) => (
                          <div
                            key={`gainer-${item.id}-${index}`}
                            className="flex items-center justify-between py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setLocation(`/item/${item.id}`)}
                            data-testid={`analytics-gainer-${item.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <TrendingUp size={16} className="text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">{item.brand || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">
                                ${item.currentPrice.toLocaleString()}
                              </p>
                              <span className="text-green-600 dark:text-green-400 text-xs flex items-center">
                                <TrendingUp size={10} className="mr-1" />
                                +{item.percentageChange.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No gainers in this period
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Losers */}
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        Top Losers
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Biggest price decreases in {timeframe}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.topLosers.length > 0 ? (
                        analyticsData.topLosers.slice(0, 5).map((item, index) => (
                          <div
                            key={`loser-${item.id}-${index}`}
                            className="flex items-center justify-between py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setLocation(`/item/${item.id}`)}
                            data-testid={`analytics-loser-${item.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <TrendingDown size={16} className="text-red-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">{item.brand || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">
                                ${item.currentPrice.toLocaleString()}
                              </p>
                              <span className="text-red-600 dark:text-red-400 text-xs flex items-center">
                                <TrendingDown size={10} className="mr-1" />
                                {item.percentageChange.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No losers in this period
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Loading state for analytics */}
            {selectedCategory && analyticsLoading && (
              <Card className="bg-card border border-border">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading market analytics...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fallback Price Chart - Show only when no analytics data available */}
            {selectedCategory && !analyticsData && !analyticsLoading && categoryResults.length > 0 && (
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Category Price Trends
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Price history for {[...categoryResults]
                      .sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0))[0]?.name || 'representative item'}
                  </p>
                </CardHeader>
                <CardContent data-testid="chart-price">
                  <PriceChart
                    collectibleId={[...categoryResults]
                      .sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0))[0]?.id || ''}
                    collectibleName={[...categoryResults]
                      .sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0))[0]?.name || ''}
                  />
                </CardContent>
              </Card>
            )}


            {/* Quick Actions */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" className="flex items-center gap-2" data-testid="button-watch-category">
                    <Eye size={16} />
                    Watch Category
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2" data-testid="button-price-alert">
                    <Bell size={16} />
                    Create Price Alert
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2" data-testid="button-market-report">
                    <Activity size={16} />
                    View Market Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

      </div>
    </main>
  );
}