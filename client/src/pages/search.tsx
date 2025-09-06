import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FeaturedItem } from "@/components/featured-item";
import { TrendingItems } from "@/components/trending-items";
import { CategoryFilter } from "@/components/category-filter";
import { MarketStats } from "@/components/market-stats";
import { PriceAlerts } from "@/components/price-alerts";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import type { Category } from "@shared/schema";

export function SearchPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <CategoryFilter
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Featured Collectible - Rolex Watch with Chart */}
        <FeaturedItem collectibleId="30ede095-8a47-43d4-9178-88509239a07a" />

        {/* Trending Items Grid */}
        <TrendingItems />

        {/* Price Alerts */}
        <PriceAlerts />

        {/* Market Overview Stats */}
        <MarketStats />
      </div>
    </main>
  );
}