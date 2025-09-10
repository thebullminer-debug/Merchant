import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Search,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  AlertTriangle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Collectible } from "@shared/schema";

interface PortfolioItem {
  id: string;
  collectibleId: string;
  collectible: Collectible;
  purchasePrice: number;
  purchaseDate: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  gain: number;
  gainPercent: number;
}

export default function Portfolio() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("gain-percent");
  const [timeframe, setTimeframe] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    collectibleId: "",
    purchasePrice: "",
    quantity: "1",
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Portfolio data query
  const { data: portfolioItems = [], isLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio"],
    enabled: true
  });

  // Portfolio stats query
  const { data: portfolioStats } = useQuery<any>({
    queryKey: ["/api/portfolio/stats"],
    enabled: true
  });

  // Collectibles for adding to portfolio
  const { data: collectibles = [] } = useQuery<Collectible[]>({
    queryKey: ["/api/collectibles"],
    enabled: showAddDialog
  });

  // Add to portfolio mutation
  const addToPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to add to portfolio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setShowAddDialog(false);
      setNewItem({
        collectibleId: "",
        purchasePrice: "",
        quantity: "1",
        purchaseDate: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Success",
        description: "Item added to portfolio"
      });
    }
  });

  const filteredItems = (portfolioItems as PortfolioItem[]).filter((item: PortfolioItem) =>
    item.collectible.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.collectible.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a: PortfolioItem, b: PortfolioItem) => {
    switch (sortBy) {
      case "gain-percent":
        return b.gainPercent - a.gainPercent;
      case "gain-absolute":
        return b.gain - a.gain;
      case "value":
        return b.totalValue - a.totalValue;
      case "alphabetical":
        return a.collectible.name.localeCompare(b.collectible.name);
      default:
        return 0;
    }
  });

  const mockPortfolioItems: PortfolioItem[] = [
    {
      id: "1",
      collectibleId: "30ede095-8a47-43d4-9178-88509239a07a",
      collectible: {
        id: "30ede095-8a47-43d4-9178-88509239a07a",
        name: "Rolex Submariner Date",
        description: "Iconic diving watch",
        categoryId: "watches",
        brand: "Rolex",
        model: "126610LN",
        year: 2020,
        condition: "Excellent",
        imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        tags: ["luxury", "diving"],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      purchasePrice: 11500,
      purchaseDate: "2023-06-15",
      quantity: 1,
      currentPrice: 12800,
      totalValue: 12800,
      gain: 1300,
      gainPercent: 11.3
    },
    {
      id: "2", 
      collectibleId: "dcbce0d4-1ffb-4dd0-8d32-20cd81095adf",
      collectible: {
        id: "dcbce0d4-1ffb-4dd0-8d32-20cd81095adf",
        name: "2003 LeBron James Rookie Card",
        description: "Upper Deck Exquisite Collection",
        categoryId: "trading-cards",
        brand: "Upper Deck",
        model: "Exquisite Collection",
        year: 2003,
        condition: "BGS 9.5",
        imageUrl: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        tags: ["rookie", "basketball"],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      purchasePrice: 95000,
      purchaseDate: "2023-08-20",
      quantity: 1,
      currentPrice: 125000,
      totalValue: 125000,
      gain: 30000,
      gainPercent: 31.6
    }
  ];

  const mockStats = {
    totalValue: 137800,
    totalGain: 31300,
    totalGainPercent: 29.4,
    totalInvested: 106500,
    itemCount: 2,
    topPerformer: mockPortfolioItems[1],
    worstPerformer: mockPortfolioItems[0]
  };

  const displayItems = sortedItems.length > 0 ? sortedItems : mockPortfolioItems;
  const displayStats = portfolioStats || mockStats;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Portfolio</h1>
            <p className="text-muted-foreground">Track your collectibles investments and performance</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-to-portfolio">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add to Portfolio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Collectible</Label>
                  <Select value={newItem.collectibleId} onValueChange={(value) => setNewItem(prev => ({ ...prev, collectibleId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select collectible" />
                    </SelectTrigger>
                    <SelectContent>
                      {(collectibles as Collectible[]).map((item: Collectible) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newItem.purchasePrice}
                    onChange={(e) => setNewItem(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    data-testid="input-purchase-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    data-testid="input-quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={newItem.purchaseDate}
                    onChange={(e) => setNewItem(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    data-testid="input-purchase-date"
                  />
                </div>
                <Button 
                  onClick={() => addToPortfolioMutation.mutate(newItem)}
                  disabled={addToPortfolioMutation.isPending || !newItem.collectibleId || !newItem.purchasePrice}
                  className="w-full"
                  data-testid="button-confirm-add"
                >
                  {addToPortfolioMutation.isPending ? "Adding..." : "Add to Portfolio"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${displayStats.totalValue?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Total Gain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-500">
                  +${displayStats.totalGain?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-green-500">
                  +{displayStats.totalGainPercent?.toFixed(1) || '0'}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Items Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {displayStats.itemCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${displayStats.totalInvested?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search portfolio items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-portfolio"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gain-percent">Best Performers</SelectItem>
              <SelectItem value="gain-absolute">Highest Gains</SelectItem>
              <SelectItem value="value">Highest Value</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Portfolio Items */}
        <div className="space-y-4">
          {displayItems.map((item: PortfolioItem) => (
            <Card key={item.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  <Link href={`/collectible/${item.collectible.id}`}>
                    <img
                      src={item.collectible.imageUrl || ''}
                      alt={item.collectible.name}
                      className="w-20 h-20 object-cover rounded-lg bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                      data-testid={`img-portfolio-${item.id}`}
                    />
                  </Link>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <Link href={`/collectible/${item.collectible.id}`}>
                        <h3 className="font-semibold text-foreground hover:text-primary cursor-pointer">
                          {item.collectible.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.collectible.brand}</span>
                        <span>•</span>
                        <span>{item.collectible.year}</span>
                        <span>•</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Purchase Price</div>
                        <div className="font-medium">${item.purchasePrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current Price</div>
                        <div className="font-medium">${item.currentPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Value</div>
                        <div className="font-medium">${item.totalValue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Gain/Loss</div>
                        <div className={`font-medium flex items-center gap-1 ${
                          item.gain >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {item.gain >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {item.gain >= 0 ? '+' : ''}${item.gain.toLocaleString()}
                          <span className="text-xs">
                            ({item.gain >= 0 ? '+' : ''}{item.gainPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={item.gain >= 0 ? "default" : "destructive"}>
                      {item.gain >= 0 ? '+' : ''}{item.gainPercent.toFixed(1)}%
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      Purchased {new Date(item.purchaseDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {displayItems.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No portfolio items yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your collectibles by adding items to your portfolio
              </p>
              <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-first-item">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}