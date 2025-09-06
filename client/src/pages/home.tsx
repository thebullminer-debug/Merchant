import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingItems } from "@/components/trending-items";
import { MarketStats } from "@/components/market-stats";
import { PriceAlerts } from "@/components/price-alerts";
import { Clock, CreditCard, Disc3, Coins, Trophy, Car, Shield, Palette, ArrowRight } from "lucide-react";
import type { Category } from "@shared/schema";

const categoryIcons = {
  "Watches": Clock,
  "Trading Cards": CreditCard,
  "Vinyl Records": Disc3,
  "Coins": Coins,
  "Sports Collectibles": Trophy,
  "Collector Cars": Car,
  "Military": Shield,
  "Art": Palette,
};

export default function Home() {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              Welcome to <span className="text-primary">Merchant</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto">
              Track collectibles like stocks. Get real-time pricing, historical trends, and market insights across all major marketplaces.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
              asChild
              data-testid="button-start-exploring"
            >
              <Link href="/search">
                Start Exploring <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Browse Categories</h2>
            <p className="text-lg text-muted-foreground">
              Discover collectibles across all major categories
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || Clock;
              return (
                <Card 
                  key={category.id} 
                  className="group hover:shadow-lg transition-shadow cursor-pointer border-border hover:border-primary/20"
                  data-testid={`category-${category.slug}`}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-sm">
                      {category.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Trending Now */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Trending Now</h2>
              <p className="text-lg text-muted-foreground">
                Hot collectibles with rising prices
              </p>
            </div>
            <Button variant="outline" asChild data-testid="button-view-all">
              <Link href="/search">View All</Link>
            </Button>
          </div>
          <TrendingItems />
        </section>

        {/* Market Statistics */}
        <MarketStats />

        {/* Price Alerts Preview */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Recent Activity</h2>
            <p className="text-lg text-muted-foreground">
              Latest price movements and alerts
            </p>
          </div>
          <PriceAlerts />
        </section>

        {/* Call to Action */}
        <section className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Ready to Start Trading Collectibles?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of collectors using real data to make informed decisions
            </p>
          </div>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
            asChild
            data-testid="button-get-started"
          >
            <Link href="/search">Get Started</Link>
          </Button>
        </section>
      </div>
    </main>
  );
}