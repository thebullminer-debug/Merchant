import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity, Calendar, Target } from "lucide-react";
import { PriceChart } from "@/components/price-chart";
import type { Category } from "@shared/schema";

interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  avgPriceChange: number;
  activeListings: number;
  topGainers: Array<{
    id: string;
    name: string;
    priceChange: number;
    currentPrice: number;
  }>;
  topLosers: Array<{
    id: string;
    name: string;
    priceChange: number;
    currentPrice: number;
  }>;
}

interface CategoryStats {
  categoryId: string;
  categoryName: string;
  marketCap: number;
  volume24h: number;
  priceChange: number;
  itemCount: number;
}

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("7d");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: marketOverview, isLoading: overviewLoading } = useQuery<MarketOverview>({
    queryKey: ["/api/analytics/overview", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/overview?timeframe=${timeframe}`);
      if (!response.ok) throw new Error("Failed to fetch market overview");
      return response.json();
    },
  });

  const { data: categoryStats = [], isLoading: statsLoading } = useQuery<CategoryStats[]>({
    queryKey: ["/api/analytics/categories", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/categories?timeframe=${timeframe}`);
      if (!response.ok) throw new Error("Failed to fetch category stats");
      return response.json();
    },
  });

  const StatCard = ({ title, value, change, icon: Icon, suffix = "" }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {typeof value === 'number' && !suffix ? value.toLocaleString() : `${value}${suffix}`}
            </p>
            {change !== undefined && (
              <p className={`text-sm flex items-center gap-1 mt-1 ${
                change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Market
                <span className="text-primary"> Analytics</span>
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Deep insights into collectibles market performance and trends
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Market Overview Stats */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Market Overview</h2>
          {overviewLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="loading-shimmer h-4 w-24 mb-2 rounded"></div>
                    <div className="loading-shimmer h-8 w-32 mb-2 rounded"></div>
                    <div className="loading-shimmer h-4 w-16 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : marketOverview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Market Cap"
                value={`$${(marketOverview.totalMarketCap / 1000000).toFixed(1)}M`}
                change={marketOverview.avgPriceChange}
                icon={DollarSign}
              />
              <StatCard
                title="24h Volume"
                value={`$${(marketOverview.totalVolume24h / 1000).toFixed(0)}K`}
                icon={BarChart3}
              />
              <StatCard
                title="Active Listings"
                value={marketOverview.activeListings}
                icon={Activity}
              />
              <StatCard
                title="Avg Price Change"
                value={marketOverview.avgPriceChange.toFixed(1)}
                suffix="%"
                change={marketOverview.avgPriceChange}
                icon={Target}
              />
            </div>
          ) : null}
        </section>

        {/* Tabs for Different Analytics Views */}
        <section>
          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="movers">Top Movers</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Category Performance */}
            <TabsContent value="categories" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">Category Performance</h3>
              </div>
              
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="loading-shimmer h-6 w-32 mb-4 rounded"></div>
                        <div className="space-y-2">
                          <div className="loading-shimmer h-4 w-24 rounded"></div>
                          <div className="loading-shimmer h-4 w-20 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryStats.map((category, index) => (
                    <Card key={`${category.categoryId}-${index}`} className="bg-card border border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.categoryName}</CardTitle>
                          <Badge 
                            variant={category.priceChange >= 0 ? "default" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {category.priceChange >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {category.priceChange >= 0 ? '+' : ''}{category.priceChange.toFixed(1)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Market Cap</p>
                            <p className="font-semibold">
                              ${(category.marketCap / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Items</p>
                            <p className="font-semibold">{category.itemCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">24h Volume</p>
                            <p className="font-semibold">
                              ${(category.volume24h / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Change</p>
                            <p className={`font-semibold ${
                              category.priceChange >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {category.priceChange >= 0 ? '+' : ''}{category.priceChange.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Top Movers */}
            <TabsContent value="movers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Gainers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Top Gainers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {marketOverview?.topGainers?.length ? (
                      <div className="space-y-3">
                        {marketOverview.topGainers.slice(0, 5).map((item, index) => (
                          <div 
                            key={`${item.id}-${index}`} 
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ${item.currentPrice.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="default" className="text-green-600 dark:text-green-400">
                              +{item.priceChange.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Losers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      Top Losers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {marketOverview?.topLosers?.length ? (
                      <div className="space-y-3">
                        {marketOverview.topLosers.slice(0, 5).map((item, index) => (
                          <div 
                            key={`${item.id}-${index}`} 
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ${item.currentPrice.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="destructive">
                              {item.priceChange.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Market Trends */}
            <TabsContent value="trends" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">Market Trends</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Overall Market Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <PieChart className="w-12 h-12 mx-auto mb-4" />
                        <p>Market trends chart would be displayed here</p>
                        <p className="text-sm mt-1">Integration with charting library needed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}