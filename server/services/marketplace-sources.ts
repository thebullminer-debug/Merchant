export interface MarketplaceSource {
  id: string;
  name: string;
  baseUrl: string;
  category: 'auction' | 'marketplace' | 'retail' | 'auction_house';
  reliability: number; // 1-10 scale
  dataTypes: Array<'price' | 'volume' | 'condition' | 'rarity' | 'authenticity'>;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  apiKey?: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  supportedCategories: string[];
  priceAccuracy: number; // 1-10 scale
  volumeAccuracy: number; // 1-10 scale
}

export const MARKETPLACE_SOURCES: MarketplaceSource[] = [
  {
    id: 'ebay',
    name: 'eBay',
    baseUrl: 'https://api.ebay.com',
    category: 'marketplace',
    reliability: 9,
    dataTypes: ['price', 'volume', 'condition'],
    updateFrequency: 'hourly',
    rateLimit: { requestsPerMinute: 100, requestsPerDay: 10000 },
    supportedCategories: ['watches', 'trading-cards', 'vinyl-records', 'coins', 'sports', 'cars', 'military', 'art'],
    priceAccuracy: 8,
    volumeAccuracy: 9
  },
  {
    id: 'heritage-auctions',
    name: 'Heritage Auctions',
    baseUrl: 'https://api.ha.com',
    category: 'auction_house',
    reliability: 10,
    dataTypes: ['price', 'condition', 'rarity', 'authenticity'],
    updateFrequency: 'daily',
    rateLimit: { requestsPerMinute: 50, requestsPerDay: 5000 },
    supportedCategories: ['trading-cards', 'coins', 'sports', 'art', 'military'],
    priceAccuracy: 10,
    volumeAccuracy: 7
  },
  {
    id: 'pwcc',
    name: 'PWCC Marketplace',
    baseUrl: 'https://api.pwccmarketplace.com',
    category: 'auction',
    reliability: 9,
    dataTypes: ['price', 'volume', 'condition', 'rarity'],
    updateFrequency: 'hourly',
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 8000 },
    supportedCategories: ['trading-cards', 'sports'],
    priceAccuracy: 9,
    volumeAccuracy: 8
  },
  {
    id: 'comc',
    name: 'Check Out My Cards (COMC)',
    baseUrl: 'https://api.comc.com',
    category: 'marketplace',
    reliability: 8,
    dataTypes: ['price', 'volume', 'condition'],
    updateFrequency: 'daily',
    rateLimit: { requestsPerMinute: 40, requestsPerDay: 3000 },
    supportedCategories: ['trading-cards', 'sports'],
    priceAccuracy: 7,
    volumeAccuracy: 8
  },
  {
    id: 'whatnot',
    name: 'Whatnot',
    baseUrl: 'https://api.whatnot.com',
    category: 'auction',
    reliability: 7,
    dataTypes: ['price', 'volume'],
    updateFrequency: 'realtime',
    rateLimit: { requestsPerMinute: 200, requestsPerDay: 15000 },
    supportedCategories: ['trading-cards', 'sports', 'vinyl-records'],
    priceAccuracy: 6,
    volumeAccuracy: 9
  },
  {
    id: 'discogs',
    name: 'Discogs',
    baseUrl: 'https://api.discogs.com',
    category: 'marketplace',
    reliability: 9,
    dataTypes: ['price', 'volume', 'condition', 'rarity'],
    updateFrequency: 'hourly',
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 1000 },
    supportedCategories: ['vinyl-records'],
    priceAccuracy: 9,
    volumeAccuracy: 8
  },
  {
    id: 'chrono24',
    name: 'Chrono24',
    baseUrl: 'https://api.chrono24.com',
    category: 'marketplace',
    reliability: 9,
    dataTypes: ['price', 'volume', 'condition', 'authenticity'],
    updateFrequency: 'hourly',
    rateLimit: { requestsPerMinute: 30, requestsPerDay: 2000 },
    supportedCategories: ['watches'],
    priceAccuracy: 9,
    volumeAccuracy: 7
  },
  {
    id: 'psa-auction',
    name: 'PSA Auction Prices',
    baseUrl: 'https://api.psacard.com',
    category: 'auction_house',
    reliability: 10,
    dataTypes: ['price', 'condition', 'rarity', 'authenticity'],
    updateFrequency: 'daily',
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 1000 },
    supportedCategories: ['trading-cards', 'sports'],
    priceAccuracy: 10,
    volumeAccuracy: 6
  },
  {
    id: 'invaluable',
    name: 'Invaluable',
    baseUrl: 'https://api.invaluable.com',
    category: 'auction_house',
    reliability: 8,
    dataTypes: ['price', 'condition', 'rarity'],
    updateFrequency: 'daily',
    rateLimit: { requestsPerMinute: 25, requestsPerDay: 1500 },
    supportedCategories: ['art', 'coins', 'military', 'cars'],
    priceAccuracy: 8,
    volumeAccuracy: 5
  },
  {
    id: 'barnebys',
    name: 'Barnebys',
    baseUrl: 'https://api.barnebys.com',
    category: 'auction_house',
    reliability: 8,
    dataTypes: ['price', 'condition', 'rarity'],
    updateFrequency: 'daily',
    rateLimit: { requestsPerMinute: 30, requestsPerDay: 2000 },
    supportedCategories: ['art', 'coins', 'military', 'cars', 'watches'],
    priceAccuracy: 8,
    volumeAccuracy: 6
  },
  {
    id: 'liveauctioneers',
    name: 'LiveAuctioneers',
    baseUrl: 'https://api.liveauctioneers.com',
    category: 'auction_house',
    reliability: 8,
    dataTypes: ['price', 'condition', 'rarity'],
    updateFrequency: 'daily',
    rateLimit: { requestsPerMinute: 40, requestsPerDay: 3000 },
    supportedCategories: ['art', 'coins', 'military', 'cars', 'watches', 'vinyl-records'],
    priceAccuracy: 8,
    volumeAccuracy: 7
  },
  {
    id: 'bring-a-trailer',
    name: 'Bring a Trailer',
    baseUrl: 'https://api.bringatrailer.com',
    category: 'auction',
    reliability: 9,
    dataTypes: ['price', 'volume', 'condition'],
    updateFrequency: 'daily',
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 1000 },
    supportedCategories: ['cars'],
    priceAccuracy: 9,
    volumeAccuracy: 8
  },
  {
    id: 'mecum',
    name: 'Mecum Auctions',
    baseUrl: 'https://api.mecum.com',
    category: 'auction_house',
    reliability: 9,
    dataTypes: ['price', 'condition', 'rarity'],
    updateFrequency: 'weekly',
    rateLimit: { requestsPerMinute: 15, requestsPerDay: 500 },
    supportedCategories: ['cars'],
    priceAccuracy: 9,
    volumeAccuracy: 6
  },
  {
    id: 'rock-island',
    name: 'Rock Island Auction',
    baseUrl: 'https://api.rockislandauction.com',
    category: 'auction_house',
    reliability: 9,
    dataTypes: ['price', 'condition', 'rarity', 'authenticity'],
    updateFrequency: 'weekly',
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 300 },
    supportedCategories: ['military'],
    priceAccuracy: 10,
    volumeAccuracy: 5
  },
  {
    id: 'bonhams',
    name: 'Bonhams',
    baseUrl: 'https://api.bonhams.com',
    category: 'auction_house',
    reliability: 10,
    dataTypes: ['price', 'condition', 'rarity', 'authenticity'],
    updateFrequency: 'weekly',
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 800 },
    supportedCategories: ['art', 'watches', 'cars', 'coins'],
    priceAccuracy: 10,
    volumeAccuracy: 5
  },
  {
    id: 'christies',
    name: "Christie's",
    baseUrl: 'https://api.christies.com',
    category: 'auction_house',
    reliability: 10,
    dataTypes: ['price', 'condition', 'rarity', 'authenticity'],
    updateFrequency: 'weekly',
    rateLimit: { requestsPerMinute: 15, requestsPerDay: 500 },
    supportedCategories: ['art', 'watches'],
    priceAccuracy: 10,
    volumeAccuracy: 4
  }
];

export class SourceManager {
  private activeSources: Set<string> = new Set();
  private sourceHealth: Map<string, number> = new Map();
  private lastUpdated: Map<string, Date> = new Map();

  constructor() {
    // Initialize all sources as active
    MARKETPLACE_SOURCES.forEach(source => {
      this.activeSources.add(source.id);
      this.sourceHealth.set(source.id, source.reliability);
      this.lastUpdated.set(source.id, new Date());
    });
  }

  getSourcesByCategory(category: string): MarketplaceSource[] {
    return MARKETPLACE_SOURCES.filter(source => 
      source.supportedCategories.includes(category) && 
      this.activeSources.has(source.id)
    ).sort((a, b) => (this.sourceHealth.get(b.id) || 0) - (this.sourceHealth.get(a.id) || 0));
  }

  getBestSourcesForCategory(category: string, limit = 5): MarketplaceSource[] {
    return this.getSourcesByCategory(category)
      .filter(source => (this.sourceHealth.get(source.id) || 0) >= 7)
      .slice(0, limit);
  }

  updateSourceHealth(sourceId: string, successRate: number) {
    const currentHealth = this.sourceHealth.get(sourceId) || 0;
    const newHealth = Math.round((currentHealth * 0.8) + (successRate * 10 * 0.2));
    this.sourceHealth.set(sourceId, Math.max(1, Math.min(10, newHealth)));
    this.lastUpdated.set(sourceId, new Date());
  }

  disableSource(sourceId: string) {
    this.activeSources.delete(sourceId);
  }

  enableSource(sourceId: string) {
    this.activeSources.add(sourceId);
  }

  getSourceHealth(sourceId: string): number {
    return this.sourceHealth.get(sourceId) || 0;
  }

  getAllActiveSources(): MarketplaceSource[] {
    return MARKETPLACE_SOURCES.filter(source => this.activeSources.has(source.id));
  }

  getSourceById(sourceId: string): MarketplaceSource | undefined {
    return MARKETPLACE_SOURCES.find(source => source.id === sourceId);
  }

  getHighReliabilitySources(): MarketplaceSource[] {
    return MARKETPLACE_SOURCES.filter(source => 
      source.reliability >= 9 && this.activeSources.has(source.id)
    );
  }

  getRealtimeSources(): MarketplaceSource[] {
    return MARKETPLACE_SOURCES.filter(source => 
      source.updateFrequency === 'realtime' && this.activeSources.has(source.id)
    );
  }
}

export const sourceManager = new SourceManager();