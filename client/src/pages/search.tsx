import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FeaturedItem } from "@/components/featured-item";
import { TrendingItems } from "@/components/trending-items";
import { CategoryFilter } from "@/components/category-filter";
import { MarketStats } from "@/components/market-stats";
import { PriceAlerts } from "@/components/price-alerts";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal, TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";
import type { Category, Collectible } from "@shared/schema";

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

interface SearchResult extends Collectible {
  currentPrice?: number;
  priceChange?: number;
  activeListings?: number;
}

export function SearchPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Get search query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q') || '';

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: searchResults = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/collectibles/search", searchQuery, selectedCategory, sortBy],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const params = new URLSearchParams({
        q: searchQuery,
        ...(selectedCategory && { category: selectedCategory }),
        sort: sortBy,
      });
      
      const response = await fetch(`/api/collectibles/search?${params}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: !!searchQuery,
  });

  // Query for category-based collectibles when no search query but category is selected
  const { data: categoryResults = [], isLoading: categoryLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/collectibles", selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      
      const response = await fetch(`/api/collectibles?category=${selectedCategory}`);
      if (!response.ok) throw new Error("Failed to fetch category items");
      return response.json();
    },
    enabled: !!selectedCategory && !searchQuery,
  });

  const handleItemClick = (item: SearchResult) => {
    setLocation(`/item/${item.id}`);
  };

  // Determine which results to show and filter them
  const currentResults = searchQuery ? searchResults : categoryResults;
  const currentLoading = searchQuery ? isLoading : categoryLoading;
  
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
  const showCategoryGrid = !searchQuery && !selectedCategory;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search Header */}
        <section className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Find Your Next
              <span className="text-primary"> Collectible</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Search through thousands of collectibles with real-time pricing and market trends
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

        {/* Search Results or Category Results */}
        {(searchQuery || showCategoryResults) && (
          <div className="flex gap-8">
            {/* Left Sidebar - Filters */}
            <div className="w-64 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Filters</h3>
                
                {/* Category Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Category</label>
                    {selectedCategory && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedCategory(null)}
                        className="h-6 px-2"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
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
                <div className="space-y-3">
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

                {/* Sort By Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="trending">Most Popular</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Main Results Area */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {searchQuery ? "Search Results" : selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name || 'Category'} Items` : "All Items"}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentLoading ? "Loading..." : 
                      searchQuery ? `${filteredResults.length} results for "${searchQuery}"` :
                      selectedCategory ? `${filteredResults.length} items in ${categories.find(c => c.id === selectedCategory)?.name}` :
                      `${filteredResults.length} items`
                    }
                  </p>
                </div>
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
            </div>
          </div>
        )}

        {/* Show categories if no search query and no category selected */}
        {showCategoryGrid && (
          <>
            {/* Categories Grid */}
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">Browse Categories</h2>
                <p className="text-lg text-muted-foreground">
                  Explore collectibles by category
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((category) => {
                  const categoryImage = categoryImages[category.name as keyof typeof categoryImages];
                  return (
                    <Card 
                      key={category.id} 
                      className="bg-card border border-border card-hover cursor-pointer transition-all duration-200 overflow-hidden"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowFilters(true);
                      }}
                      data-testid={`category-${category.id}`}
                    >
                      <div className="aspect-square overflow-hidden">
                        {categoryImage ? (
                          <img 
                            src={categoryImage}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 text-center">
                        <div>
                          <h3 className="font-semibold text-foreground">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}