import { MARKETPLACE_SOURCES, sourceManager, type MarketplaceSource } from './marketplace-sources';
import { dataAggregator } from './data-aggregator';
import { storage } from '../storage';

interface ScrapingJob {
  id: string;
  collectibleId: string;
  sources: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduledAt: Date;
  completedAt?: Date;
  errorCount: number;
  results?: any[];
}

interface ScrapingResult {
  sourceId: string;
  success: boolean;
  price?: number;
  condition?: string;
  listingUrl?: string;
  timestamp: Date;
  error?: string;
  confidence: number;
}

export class EnhancedMarketplaceScraper {
  private jobQueue: ScrapingJob[] = [];
  private activeJobs: Map<string, ScrapingJob> = new Map();
  private lastScrapingTimes: Map<string, Date> = new Map();
  private errorCounts: Map<string, number> = new Map();

  constructor() {
    // Start the job processor
    this.startJobProcessor();
  }

  async scheduleCollectibleScraping(collectibleId: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<string> {
    const collectible = await storage.getCollectible(collectibleId);
    if (!collectible || !collectible.categoryId) {
      throw new Error('Collectible not found or missing category');
    }

    // Get appropriate sources for this category
    const category = await this.getCategorySlug(collectible.categoryId);
    const sources = sourceManager.getBestSourcesForCategory(category, 8);

    const job: ScrapingJob = {
      id: Math.random().toString(36).substr(2, 9),
      collectibleId,
      sources: sources.map(s => s.id),
      priority,
      status: 'pending',
      scheduledAt: new Date(),
      errorCount: 0
    };

    this.jobQueue.push(job);
    this.sortJobQueue();

    return job.id;
  }

  async scrapeMultipleSources(collectibleId: string, sourceIds: string[]): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    const collectible = await storage.getCollectible(collectibleId);
    
    if (!collectible) {
      throw new Error('Collectible not found');
    }

    // Execute scraping for each source in parallel (respecting rate limits)
    const promises = sourceIds.map(sourceId => this.scrapeFromSource(collectible, sourceId));
    const sourceResults = await Promise.allSettled(promises);

    sourceResults.forEach((result, index) => {
      const sourceId = sourceIds[index];
      
      if (result.status === 'fulfilled') {
        results.push(result.value);
        this.updateSourceHealth(sourceId, 1.0); // Success
      } else {
        results.push({
          sourceId,
          success: false,
          timestamp: new Date(),
          error: result.reason?.message || 'Unknown error',
          confidence: 0
        });
        this.updateSourceHealth(sourceId, 0.0); // Failure
      }
    });

    return results;
  }

  private async scrapeFromSource(collectible: any, sourceId: string): Promise<ScrapingResult> {
    const source = sourceManager.getSourceById(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    // Check rate limits
    await this.respectRateLimit(source);

    try {
      // Mock scraping logic (replace with actual API calls)
      const scrapedData = await this.performActualScraping(collectible, source);
      
      // Store the price data
      await storage.addPriceData({
        collectibleId: collectible.id,
        source: sourceId,
        price: scrapedData.price.toString(),
        condition: scrapedData.condition,
        listingUrl: scrapedData.listingUrl
      });

      return {
        sourceId,
        success: true,
        price: scrapedData.price,
        condition: scrapedData.condition,
        listingUrl: scrapedData.listingUrl,
        timestamp: new Date(),
        confidence: source.priceAccuracy / 10
      };

    } catch (error: any) {
      throw new Error(`Scraping failed for ${source.name}: ${error.message}`);
    }
  }

  private async performActualScraping(collectible: any, source: MarketplaceSource): Promise<any> {
    // This is where you'd implement actual API calls to each marketplace
    // For now, returning realistic mock data based on the source
    
    const basePrice = this.getBasePriceForCollectible(collectible);
    const sourceMultiplier = this.getSourcePriceMultiplier(source.id);
    const randomVariation = 0.9 + (Math.random() * 0.2); // ±10% variation
    
    const price = Math.round(basePrice * sourceMultiplier * randomVariation);
    
    return {
      price,
      condition: this.getRandomCondition(),
      listingUrl: `${source.baseUrl}/item/${Math.random().toString(36).substr(2, 9)}`,
      volume: Math.floor(Math.random() * 20) + 1
    };
  }

  private getBasePriceForCollectible(collectible: any): number {
    // Determine base price based on collectible type and metadata
    if (collectible.name.toLowerCase().includes('rolex')) return 12000;
    if (collectible.name.toLowerCase().includes('patek')) return 180000;
    if (collectible.name.toLowerCase().includes('lebron')) return 120000;
    if (collectible.name.toLowerCase().includes('mantle')) return 90000;
    if (collectible.name.toLowerCase().includes('beatles')) return 800;
    
    return 1000; // Default fallback
  }

  private getSourcePriceMultiplier(sourceId: string): number {
    // Different sources tend to have different price levels
    const multipliers: {[key: string]: number} = {
      'heritage-auctions': 1.15, // Premium auction house
      'christies': 1.25, // Highest premium
      'bonhams': 1.20,
      'pwcc': 1.10,
      'ebay': 1.0, // Baseline
      'comc': 0.95,
      'whatnot': 0.90, // Typically lower prices
      'discogs': 0.98,
      'chrono24': 1.05
    };
    
    return multipliers[sourceId] || 1.0;
  }

  private getRandomCondition(): string {
    const conditions = ['Mint', 'Near Mint', 'Excellent', 'Very Good', 'Good', 'Fair'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private async respectRateLimit(source: MarketplaceSource): Promise<void> {
    const lastScrape = this.lastScrapingTimes.get(source.id);
    const minInterval = 60000 / source.rateLimit.requestsPerMinute; // ms between requests
    
    if (lastScrape) {
      const timeSince = Date.now() - lastScrape.getTime();
      if (timeSince < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSince));
      }
    }
    
    this.lastScrapingTimes.set(source.id, new Date());
  }

  private updateSourceHealth(sourceId: string, successRate: number): void {
    sourceManager.updateSourceHealth(sourceId, successRate);
  }

  private async getCategorySlug(categoryId: string): Promise<string> {
    const categories = await storage.getCategories();
    const category = categories.find(c => c.id === categoryId);
    return category?.slug || 'unknown';
  }

  private sortJobQueue(): void {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    this.jobQueue.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority] || 
             a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
  }

  private startJobProcessor(): void {
    setInterval(async () => {
      if (this.jobQueue.length > 0 && this.activeJobs.size < 5) { // Max 5 concurrent jobs
        const job = this.jobQueue.shift();
        if (job) {
          this.processJob(job);
        }
      }
    }, 1000); // Check every second
  }

  private async processJob(job: ScrapingJob): Promise<void> {
    this.activeJobs.set(job.id, job);
    job.status = 'running';

    try {
      const results = await this.scrapeMultipleSources(job.collectibleId, job.sources);
      job.results = results;
      job.status = 'completed';
      job.completedAt = new Date();

      // Update aggregated price data
      await dataAggregator.aggregatePriceData(job.collectibleId);

    } catch (error: any) {
      job.status = 'failed';
      job.errorCount++;
      console.error(`Scraping job ${job.id} failed:`, error.message);

      // Retry logic for failed jobs
      if (job.errorCount < 3 && job.priority !== 'low') {
        job.status = 'pending';
        job.scheduledAt = new Date(Date.now() + 300000); // Retry in 5 minutes
        this.jobQueue.push(job);
        this.sortJobQueue();
      }
    }

    this.activeJobs.delete(job.id);
  }

  // Public methods for monitoring and management

  getQueueStatus(): any {
    return {
      pendingJobs: this.jobQueue.length,
      activeJobs: this.activeJobs.size,
      queueByPriority: {
        critical: this.jobQueue.filter(j => j.priority === 'critical').length,
        high: this.jobQueue.filter(j => j.priority === 'high').length,
        medium: this.jobQueue.filter(j => j.priority === 'medium').length,
        low: this.jobQueue.filter(j => j.priority === 'low').length
      }
    };
  }

  async getSourceHealthReport(): Promise<any> {
    const report: any = {};
    
    for (const source of MARKETPLACE_SOURCES) {
      const health = sourceManager.getSourceHealth(source.id);
      const errorCount = this.errorCounts.get(source.id) || 0;
      const lastScrape = this.lastScrapingTimes.get(source.id);
      
      report[source.id] = {
        name: source.name,
        health: health,
        reliability: source.reliability,
        errorCount: errorCount,
        lastScrape: lastScrape,
        isActive: sourceManager.getAllActiveSources().some(s => s.id === source.id),
        category: source.category,
        updateFrequency: source.updateFrequency
      };
    }
    
    return report;
  }

  async triggerEmergencyScraping(collectibleId: string): Promise<string> {
    return this.scheduleCollectibleScraping(collectibleId, 'critical');
  }

  pauseSource(sourceId: string): void {
    sourceManager.disableSource(sourceId);
  }

  resumeSource(sourceId: string): void {
    sourceManager.enableSource(sourceId);
  }
}

export const enhancedMarketplaceScraper = new EnhancedMarketplaceScraper();