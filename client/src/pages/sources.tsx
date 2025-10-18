import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Globe, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Play,
  Pause,
  BarChart3,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketplaceSource {
  id: string;
  name: string;
  baseUrl: string;
  category: 'auction' | 'marketplace' | 'retail' | 'auction_house';
  reliability: number;
  dataTypes: string[];
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  supportedCategories: string[];
  priceAccuracy: number;
  volumeAccuracy: number;
}

interface SourceHealth {
  name: string;
  health: number;
  reliability: number;
  errorCount: number;
  lastScrape?: Date;
  isActive: boolean;
  category: string;
  updateFrequency: string;
}

export default function SourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading: sourcesLoading } = useQuery<MarketplaceSource[]>({
    queryKey: ["/api/sources"],
  });

  const { data: sourceHealth = {}, isLoading: healthLoading } = useQuery<{[key: string]: SourceHealth}>({
    queryKey: ["/api/sources/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  interface QueueStatus {
    activeJobs: number;
    pendingJobs: number;
    queueByPriority?: {
      critical?: number;
      high?: number;
      medium?: number;
    };
  }

  const { data: queueStatus } = useQuery<QueueStatus>({
    queryKey: ["/api/scraping/queue"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const pauseSourceMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const response = await fetch(`/api/sources/${sourceId}/pause`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to pause source');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources/health"] });
      toast({ title: "Source paused", description: "Source has been temporarily disabled" });
    }
  });

  const resumeSourceMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const response = await fetch(`/api/sources/${sourceId}/resume`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to resume source');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources/health"] });
      toast({ title: "Source resumed", description: "Source has been reactivated" });
    }
  });

  const categories = ["all", "auction", "marketplace", "retail", "auction_house"];
  const filteredSources = selectedCategory === "all" 
    ? sources 
    : sources.filter(source => source.category === selectedCategory);

  const getHealthColor = (health: number) => {
    if (health >= 8) return "text-green-600";
    if (health >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBadgeVariant = (health: number) => {
    if (health >= 8) return "default";
    if (health >= 6) return "secondary";
    return "destructive";
  };

  const formatLastScrape = (date?: Date) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Sources</h1>
            <p className="text-muted-foreground">Monitor and manage marketplace data sources</p>
          </div>
        </div>

        {/* Queue Status */}
        {queueStatus ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Scraping Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{queueStatus.activeJobs}</div>
                  <div className="text-sm text-muted-foreground">Active Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{queueStatus.pendingJobs}</div>
                  <div className="text-sm text-muted-foreground">Pending Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{queueStatus.queueByPriority?.critical || 0}</div>
                  <div className="text-sm text-muted-foreground">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{queueStatus.queueByPriority?.high || 0}</div>
                  <div className="text-sm text-muted-foreground">High Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{queueStatus.queueByPriority?.medium || 0}</div>
                  <div className="text-sm text-muted-foreground">Medium Priority</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
              data-testid={`filter-${category}`}
            >
              {category.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSources.map((source) => {
            const health = sourceHealth[source.id];
            const isActive = health?.isActive ?? true;
            
            return (
              <Card key={source.id} className={`transition-all ${!isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      {source.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      {isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {source.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getHealthBadgeVariant(health?.health || 0)}>
                      Health: {health?.health || 0}/10
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Reliability</div>
                      <div className="font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {source.reliability}/10
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Price Accuracy</div>
                      <div className="font-semibold flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {source.priceAccuracy}/10
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Update Frequency</div>
                      <div className="font-semibold flex items-center gap-1 capitalize">
                        <Clock className="w-3 h-3" />
                        {source.updateFrequency}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Error Count</div>
                      <div className={`font-semibold flex items-center gap-1 ${
                        (health?.errorCount || 0) > 5 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {health?.errorCount || 0}
                      </div>
                    </div>
                  </div>

                  {/* Rate Limits */}
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Rate Limits</div>
                    <div className="text-sm">
                      <div>{source.rateLimit.requestsPerMinute}/min</div>
                      <div>{source.rateLimit.requestsPerDay}/day</div>
                    </div>
                  </div>

                  {/* Last Scrape */}
                  <div className="text-xs">
                    <span className="text-muted-foreground">Last scrape: </span>
                    <span className="font-medium">{formatLastScrape(health?.lastScrape)}</span>
                  </div>

                  {/* Supported Categories */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Supported Categories</div>
                    <div className="flex flex-wrap gap-1">
                      {source.supportedCategories.slice(0, 3).map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat.replace('-', ' ')}
                        </Badge>
                      ))}
                      {source.supportedCategories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{source.supportedCategories.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pauseSourceMutation.mutate(source.id)}
                        disabled={pauseSourceMutation.isPending}
                        className="flex-1"
                        data-testid={`pause-${source.id}`}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resumeSourceMutation.mutate(source.id)}
                        disabled={resumeSourceMutation.isPending}
                        className="flex-1"
                        data-testid={`resume-${source.id}`}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredSources.length === 0 && !sourcesLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No sources found</h3>
              <p className="text-muted-foreground">
                No sources available for the selected category
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
