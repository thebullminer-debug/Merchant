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

        {/* Featured Examples */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">High-Value Collectibles</h2>
            <p className="text-lg text-muted-foreground">
              Examples of valuable items tracked on our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Rolex Submariner */}
            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Rolex Submariner"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Rolex Submariner Date</CardTitle>
                <p className="text-2xl font-bold text-primary">$12,800</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Iconic diving watch with black ceramic bezel. A cornerstone of luxury watch collecting.</p>
              </CardContent>
            </Card>

            {/* Beatles Abbey Road Vinyl */}
            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img 
                  src="@assets/81Q7HZYO1rL._SX522__1757200803184.jpg"
                  alt="Beatles Abbey Road Vinyl Record"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">The Beatles - Abbey Road</CardTitle>
                <p className="text-2xl font-bold text-primary">$8,500</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Original pressing of the legendary final album. Vinyl records are experiencing unprecedented demand.</p>
              </CardContent>
            </Card>

            {/* Mickey Mantle Baseball Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img 
                  src="@assets/mantle-card-getty_1757200876816.webp"
                  alt="Mickey Mantle 1952 Topps Baseball Card"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Mickey Mantle 1952 Topps</CardTitle>
                <p className="text-2xl font-bold text-primary">$95,000</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Legendary Yankees baseball card. One of the most valuable sports cards ever produced.</p>
              </CardContent>
            </Card>
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