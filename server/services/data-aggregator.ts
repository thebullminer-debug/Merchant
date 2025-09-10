import { MARKETPLACE_SOURCES, sourceManager, type MarketplaceSource } from './marketplace-sources';
import { storage } from '../storage';

interface PriceDataPoint {
  price: number;
  source: string;
  timestamp: Date;
  condition?: string;
  volume?: number;
  confidence: number;
}

interface AggregatedPrice {
  medianPrice: number;
  averagePrice: number;
  lowPrice: number;
  highPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  totalVolume: number;
  sourceCount: number;
  confidence: number;
  lastUpdated: Date;
}

export class DataAggregator {
  private priceCache: Map<string, PriceDataPoint[]> = new Map();
  private aggregationCache: Map<string, AggregatedPrice> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async aggregatePriceData(collectibleId: string): Promise<AggregatedPrice | null> {
    // Check cache first
    const cached = this.aggregationCache.get(collectibleId);
    if (cached && (Date.now() - cached.lastUpdated.getTime()) < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Get recent price data from all sources
      const priceHistory = await storage.getPriceHistory(collectibleId, 7);
      
      if (priceHistory.length === 0) {
        return null;
      }

      // Group by source and calculate weights
      const sourceData = this.groupPricesBySource(priceHistory);
      const weightedPrices = this.calculateWeightedPrices(sourceData);

      // Calculate aggregated metrics
      const aggregated = this.calculateAggregatedMetrics(weightedPrices, priceHistory);
      
      // Cache the result
      this.aggregationCache.set(collectibleId, aggregated);
      
      return aggregated;
    } catch (error) {
      console.error(`Error aggregating price data for ${collectibleId}:`, error);
      return null;
    }
  }

  private groupPricesBySource(priceHistory: any[]): Map<string, PriceDataPoint[]> {
    const sourceMap = new Map<string, PriceDataPoint[]>();

    priceHistory.forEach(price => {
      const source = price.source || 'unknown';
      const sourceInfo = sourceManager.getSourceById(source);
      
      if (!sourceMap.has(source)) {
        sourceMap.set(source, []);
      }

      sourceMap.get(source)!.push({
        price: Number(price.price),
        source: source,
        timestamp: new Date(price.scrapedAt),
        condition: price.condition,
        confidence: sourceInfo ? sourceInfo.priceAccuracy / 10 : 0.5
      });
    });

    return sourceMap;
  }

  private calculateWeightedPrices(sourceData: Map<string, PriceDataPoint[]>): PriceDataPoint[] {
    const weightedPrices: PriceDataPoint[] = [];

    sourceData.forEach((prices, sourceId) => {
      const sourceInfo = sourceManager.getSourceById(sourceId);
      const sourceWeight = sourceInfo ? sourceInfo.reliability / 10 : 0.5;
      const healthWeight = sourceManager.getSourceHealth(sourceId) / 10;
      
      const combinedWeight = (sourceWeight + healthWeight) / 2;

      // Take the most recent prices from each source
      const recentPrices = prices
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5); // Last 5 entries per source

      recentPrices.forEach(price => {
        weightedPrices.push({
          ...price,
          confidence: price.confidence * combinedWeight
        });
      });
    });

    return weightedPrices.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateAggregatedMetrics(weightedPrices: PriceDataPoint[], allPriceHistory: any[]): AggregatedPrice {
    if (weightedPrices.length === 0) {
      throw new Error('No weighted prices available for aggregation');
    }

    // Sort prices by value for median calculation
    const sortedPrices = [...weightedPrices].sort((a, b) => a.price - b.price);
    
    // Calculate median (weighted)
    const medianPrice = this.calculateWeightedMedian(sortedPrices);
    
    // Calculate average
    const totalValue = weightedPrices.reduce((sum, p) => sum + (p.price * p.confidence), 0);
    const totalConfidence = weightedPrices.reduce((sum, p) => sum + p.confidence, 0);
    const averagePrice = totalValue / totalConfidence;

    // Calculate range
    const lowPrice = Math.min(...sortedPrices.map(p => p.price));
    const highPrice = Math.max(...sortedPrices.map(p => p.price));

    // Calculate price changes
    const priceChange24h = this.calculatePriceChange(allPriceHistory, 1);
    const priceChange7d = this.calculatePriceChange(allPriceHistory, 7);

    // Calculate volume (mock for now)
    const totalVolume = weightedPrices.length;

    // Overall confidence score
    const confidence = totalConfidence / weightedPrices.length;

    return {
      medianPrice: Math.round(medianPrice),
      averagePrice: Math.round(averagePrice),
      lowPrice: Math.round(lowPrice),
      highPrice: Math.round(highPrice),
      priceChange24h: Number(priceChange24h.toFixed(2)),
      priceChange7d: Number(priceChange7d.toFixed(2)),
      totalVolume,
      sourceCount: new Set(weightedPrices.map(p => p.source)).size,
      confidence: Number(confidence.toFixed(2)),
      lastUpdated: new Date()
    };
  }

  private calculateWeightedMedian(sortedPrices: PriceDataPoint[]): number {
    const totalWeight = sortedPrices.reduce((sum, p) => sum + p.confidence, 0);
    const midWeight = totalWeight / 2;
    
    let currentWeight = 0;
    for (const price of sortedPrices) {
      currentWeight += price.confidence;
      if (currentWeight >= midWeight) {
        return price.price;
      }
    }
    
    return sortedPrices[Math.floor(sortedPrices.length / 2)].price;
  }

  private calculatePriceChange(priceHistory: any[], days: number): number {
    if (priceHistory.length < 2) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentPrices = priceHistory
      .filter(p => new Date(p.scrapedAt) >= cutoffDate)
      .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime());

    const olderPrices = priceHistory
      .filter(p => new Date(p.scrapedAt) < cutoffDate)
      .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime());

    if (recentPrices.length === 0 || olderPrices.length === 0) return 0;

    const currentPrice = Number(recentPrices[0].price);
    const oldPrice = Number(olderPrices[0].price);

    return ((currentPrice - oldPrice) / oldPrice) * 100;
  }

  async getSourcePerformanceMetrics(): Promise<{[sourceId: string]: any}> {
    const metrics: {[sourceId: string]: any} = {};

    for (const source of MARKETPLACE_SOURCES) {
      const health = sourceManager.getSourceHealth(source.id);
      const isActive = sourceManager.getAllActiveSources().some(s => s.id === source.id);
      
      metrics[source.id] = {
        name: source.name,
        category: source.category,
        reliability: source.reliability,
        currentHealth: health,
        isActive,
        priceAccuracy: source.priceAccuracy,
        volumeAccuracy: source.volumeAccuracy,
        updateFrequency: source.updateFrequency,
        supportedCategories: source.supportedCategories
      };
    }

    return metrics;
  }

  clearCache() {
    this.priceCache.clear();
    this.aggregationCache.clear();
  }

  getCacheStats() {
    return {
      priceCacheSize: this.priceCache.size,
      aggregationCacheSize: this.aggregationCache.size,
      cacheDuration: this.CACHE_DURATION
    };
  }
}

export const dataAggregator = new DataAggregator();