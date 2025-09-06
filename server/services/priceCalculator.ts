import { storage } from '../storage';
import { InsertMedianPrice } from '@shared/schema';

export class PriceCalculator {
  
  calculateMedian(prices: number[]): number {
    if (prices.length === 0) return 0;
    
    const sorted = prices.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  calculatePercentageChange(currentPrice: number, previousPrice: number): number {
    if (previousPrice === 0) return 0;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }

  async calculateDailyMedians(): Promise<void> {
    try {
      const collectibles = await storage.getCollectibles();
      
      for (const collectible of collectibles) {
        await this.calculateMedianForCollectible(collectible.id);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`Calculated daily medians for ${collectibles.length} collectibles`);
    } catch (error) {
      console.error('Error calculating daily medians:', error);
    }
  }

  async calculateMedianForCollectible(collectibleId: string): Promise<void> {
    try {
      // Get recent price data (last 7 days)
      const recentPrices = await storage.getPriceHistory(collectibleId, 7);
      
      if (recentPrices.length === 0) {
        console.log(`No recent price data for collectible ${collectibleId}`);
        return;
      }

      // Extract prices and calculate statistics
      const prices = recentPrices.map(p => Number(p.price));
      const medianPrice = this.calculateMedian(prices);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const activeListings = recentPrices.filter(p => p.isActive === 1).length;

      // Get previous day's median for change calculation
      const previousMedians = await storage.getMedianPrices(collectibleId, 2);
      const previousMedian = previousMedians.length > 1 ? Number(previousMedians[previousMedians.length - 2].medianPrice) : medianPrice;
      const dayChange = this.calculatePercentageChange(medianPrice, previousMedian);

      // Create median price record
      const medianData: InsertMedianPrice = {
        collectibleId,
        date: new Date(),
        medianPrice: medianPrice.toString(),
        activeListings,
        priceRange: { min: minPrice, max: maxPrice },
        dayChange: dayChange.toString()
      };

      await storage.addMedianPrice(medianData);
      
      console.log(`Updated median price for ${collectibleId}: $${medianPrice} (${dayChange > 0 ? '+' : ''}${dayChange.toFixed(2)}%)`);
      
    } catch (error) {
      console.error(`Error calculating median for collectible ${collectibleId}:`, error);
    }
  }

  async getHistoricalTrend(collectibleId: string, days: number = 30): Promise<{
    dates: string[],
    prices: number[],
    volumes: number[]
  }> {
    try {
      const medianPrices = await storage.getMedianPrices(collectibleId, days);
      
      const dates = medianPrices.map(p => p.date.toISOString().split('T')[0]);
      const prices = medianPrices.map(p => Number(p.medianPrice));
      const volumes = medianPrices.map(p => p.activeListings || 0);

      return { dates, prices, volumes };
    } catch (error) {
      console.error('Error getting historical trend:', error);
      return { dates: [], prices: [], volumes: [] };
    }
  }

  async identifyPriceAlerts(thresholdPercentage: number = 5): Promise<Array<{
    collectibleId: string,
    name: string,
    currentPrice: number,
    previousPrice: number,
    percentageChange: number,
    direction: 'up' | 'down'
  }>> {
    try {
      const trending = await storage.getTrendingCollectibles(50);
      const alerts = [];

      for (const item of trending) {
        const change = item.priceChange || 0;
        
        if (Math.abs(change) >= thresholdPercentage) {
          alerts.push({
            collectibleId: item.id,
            name: item.name,
            currentPrice: item.currentPrice || 0,
            previousPrice: (item.currentPrice || 0) / (1 + change / 100),
            percentageChange: change,
            direction: change > 0 ? 'up' as const : 'down' as const
          });
        }
      }

      return alerts.slice(0, 10); // Return top 10 alerts
    } catch (error) {
      console.error('Error identifying price alerts:', error);
      return [];
    }
  }
}

export const priceCalculator = new PriceCalculator();
