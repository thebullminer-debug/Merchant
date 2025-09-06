import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CategoryFilter } from "@/components/category-filter";
import { TrendingItems } from "@/components/trending-items";
import { MarketStats } from "@/components/market-stats";
import { PriceAlerts } from "@/components/price-alerts";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="gradient-bg rounded-xl p-8 mb-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Collectibles <span className="text-primary">Price Oracle</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get real-time pricing data and historical trends for watches, trading cards, and vinyl records from multiple marketplaces.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-colors"
              asChild
              data-testid="button-start-tracking"
            >
              <Link href="/search">Start Tracking</Link>
            </Button>
            <Button 
              variant="outline"
              className="border-border hover:bg-secondary text-foreground px-8 py-3 rounded-lg font-semibold transition-colors"
              asChild
              data-testid="button-view-demo"
            >
              <Link href="/trending">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Trending Items Grid */}
      <TrendingItems />

      {/* Market Overview Stats */}
      <MarketStats />

      {/* Recent Price Alerts */}
      <PriceAlerts />
    </main>
  );
}
