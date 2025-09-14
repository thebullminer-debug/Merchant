import { 
  users, collectibles, categories, priceHistory, medianPrices, watchlists, priceSources,
  type User, type InsertUser, 
  type Collectible, type InsertCollectible,
  type Category, type InsertCategory,
  type PriceHistory, type InsertPriceHistory,
  type MedianPrice, type InsertMedianPrice,
  type PriceSource, type InsertPriceSource,
  type Watchlist, type InsertWatchlist
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Collectible operations
  getCollectibles(categoryId?: string, limit?: number, offset?: number): Promise<Collectible[]>;
  getCollectible(id: string): Promise<Collectible | undefined>;
  searchCollectibles(query: string, categoryId?: string): Promise<Collectible[]>;
  createCollectible(collectible: InsertCollectible): Promise<Collectible>;
  updateCollectible(id: string, collectible: Partial<InsertCollectible>): Promise<Collectible>;
  getTrendingCollectibles(limit?: number): Promise<(Collectible & { priceChange?: number, currentPrice?: number, activeListings?: number })[]>;

  // Price operations
  getPriceHistory(collectibleId: string, days?: number): Promise<PriceHistory[]>;
  addPriceData(priceData: InsertPriceHistory): Promise<PriceHistory>;
  getMedianPrices(collectibleId: string, days?: number): Promise<MedianPrice[]>;
  getMedianPricesRange(collectibleId: string, startDate: Date, endDate: Date, granularity?: string, sourceId?: string): Promise<MedianPrice[]>;
  addMedianPrice(medianPrice: InsertMedianPrice): Promise<MedianPrice>;
  bulkInsertMedianPrices(prices: InsertMedianPrice[]): Promise<MedianPrice[]>;
  getCurrentPrice(collectibleId: string): Promise<{ price: number, change: number, activeListings: number } | null>;
  
  // Price source operations
  getPriceSources(): Promise<PriceSource[]>;
  getPriceSourceByName(name: string): Promise<PriceSource | undefined>;
  addPriceSource(source: InsertPriceSource): Promise<PriceSource>;

  // Watchlist operations
  getUserWatchlist(userId: string): Promise<Watchlist[]>;
  addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: string, collectibleId: string): Promise<void>;

  // Market stats
  getMarketStats(): Promise<{ totalItems: number, totalValue: string, activeListings: number }>;

  // Analytics operations
  getTopMovers(categoryId: string, startDate: Date, endDate: Date, direction: 'gainers' | 'losers', limit?: number): Promise<Array<{
    id: string;
    name: string;
    brand?: string;
    currentPrice: number;
    previousPrice: number;
    priceChange: number;
    percentageChange: number;
    activeListings: number;
  }>>;
  
  getTopPerformers(categoryId: string, startDate: Date, endDate: Date, limit?: number): Promise<Array<{
    id: string;
    name: string;
    brand?: string;
    currentPrice: number;
    priceChange: number;
    percentageChange: number;
    activeListings: number;
    volume: number;
  }>>;
  
  getCategoryFacets(categoryId: string): Promise<{
    brands: Array<{ name: string; count: number }>;
    sports: Array<{ name: string; count: number }>;
    eras: Array<{ name: string; count: number; range: string }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getCollectibles(categoryId?: string, limit = 50, offset = 0): Promise<Collectible[]> {
    if (categoryId) {
      return await db.select().from(collectibles)
        .where(eq(collectibles.categoryId, categoryId))
        .orderBy(desc(collectibles.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      return await db.select().from(collectibles)
        .orderBy(desc(collectibles.createdAt))
        .limit(limit)
        .offset(offset);
    }
  }

  async getCollectible(id: string): Promise<Collectible | undefined> {
    const [collectible] = await db.select().from(collectibles).where(eq(collectibles.id, id));
    return collectible || undefined;
  }

  async searchCollectibles(query: string, categoryId?: string): Promise<Collectible[]> {
    const searchCondition = sql`${collectibles.name} ILIKE ${`%${query}%`} OR ${collectibles.brand} ILIKE ${`%${query}%`} OR ${collectibles.model} ILIKE ${`%${query}%`}`;
    
    if (categoryId) {
      return await db.select().from(collectibles)
        .where(and(searchCondition, eq(collectibles.categoryId, categoryId)))
        .limit(20);
    } else {
      return await db.select().from(collectibles)
        .where(searchCondition)
        .limit(20);
    }
  }

  async createCollectible(collectible: InsertCollectible): Promise<Collectible> {
    const [newCollectible] = await db.insert(collectibles).values([collectible]).returning();
    return newCollectible;
  }

  async updateCollectible(id: string, updateData: Partial<InsertCollectible>): Promise<Collectible> {
    const [updated] = await db.update(collectibles)
      .set({ ...updateData, updatedAt: sql`NOW()` })
      .where(eq(collectibles.id, id))
      .returning();
    return updated;
  }

  async getTrendingCollectibles(limit = 8): Promise<(Collectible & { priceChange?: number, currentPrice?: number, activeListings?: number })[]> {
    const result = await db.select({
      collectible: collectibles,
      currentPrice: medianPrices.medianPrice,
      priceChange: medianPrices.dayChange,
      activeListings: medianPrices.activeListings
    })
    .from(collectibles)
    .leftJoin(
      medianPrices, 
      and(
        eq(collectibles.id, medianPrices.collectibleId),
        sql`${medianPrices.date} = (
          SELECT MAX(date) 
          FROM median_prices mp2 
          WHERE mp2.collectible_id = ${collectibles.id} 
          AND mp2.date >= NOW() - INTERVAL '7 days'
        )`
      )
    )
    .where(sql`${medianPrices.collectibleId} IS NOT NULL`)
    .orderBy(desc(medianPrices.dayChange))
    .limit(limit);

    return result.map(row => ({
      ...row.collectible,
      priceChange: Number(row.priceChange) || 0,
      currentPrice: Number(row.currentPrice) || 0,
      activeListings: row.activeListings || 0
    }));
  }

  async getPriceHistory(collectibleId: string, days = 30): Promise<PriceHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select().from(priceHistory)
      .where(and(
        eq(priceHistory.collectibleId, collectibleId),
        gte(priceHistory.scrapedAt, cutoffDate)
      ))
      .orderBy(asc(priceHistory.scrapedAt));
  }

  async addPriceData(priceData: InsertPriceHistory): Promise<PriceHistory> {
    const [newPrice] = await db.insert(priceHistory).values(priceData).returning();
    return newPrice;
  }

  async getMedianPrices(collectibleId: string, days = 30): Promise<MedianPrice[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select().from(medianPrices)
      .where(and(
        eq(medianPrices.collectibleId, collectibleId),
        gte(medianPrices.date, cutoffDate)
      ))
      .orderBy(asc(medianPrices.date));
  }

  async getMedianPricesRange(
    collectibleId: string, 
    startDate: Date, 
    endDate: Date, 
    granularity?: string, 
    sourceId?: string
  ): Promise<MedianPrice[]> {
    const conditions = [
      eq(medianPrices.collectibleId, collectibleId),
      gte(medianPrices.date, startDate),
      lte(medianPrices.date, endDate)
    ];

    if (granularity) {
      conditions.push(eq(medianPrices.granularity, granularity));
    }

    if (sourceId) {
      conditions.push(eq(medianPrices.sourceId, sourceId));
    }

    return await db.select().from(medianPrices)
      .where(and(...conditions))
      .orderBy(asc(medianPrices.date));
  }

  async addMedianPrice(medianPrice: InsertMedianPrice): Promise<MedianPrice> {
    const [newMedianPrice] = await db.insert(medianPrices).values(medianPrice).returning();
    return newMedianPrice;
  }

  async bulkInsertMedianPrices(prices: InsertMedianPrice[]): Promise<MedianPrice[]> {
    if (prices.length === 0) return [];
    
    return await db.insert(medianPrices)
      .values(prices)
      .onConflictDoNothing()
      .returning();
  }

  async getCurrentPrice(collectibleId: string): Promise<{ price: number, change: number, activeListings: number } | null> {
    const [result] = await db.select({
      price: medianPrices.medianPrice,
      change: medianPrices.dayChange,
      activeListings: medianPrices.activeListings
    })
    .from(medianPrices)
    .where(eq(medianPrices.collectibleId, collectibleId))
    .orderBy(desc(medianPrices.date))
    .limit(1);

    if (!result) return null;

    return {
      price: Number(result.price),
      change: Number(result.change) || 0,
      activeListings: result.activeListings || 0
    };
  }

  async getPriceSources(): Promise<PriceSource[]> {
    return await db.select().from(priceSources)
      .where(eq(priceSources.isActive, 1))
      .orderBy(asc(priceSources.name));
  }

  async getPriceSourceByName(name: string): Promise<PriceSource | undefined> {
    const [source] = await db.select().from(priceSources)
      .where(eq(priceSources.name, name));
    return source || undefined;
  }

  async addPriceSource(source: InsertPriceSource): Promise<PriceSource> {
    const [newSource] = await db.insert(priceSources).values(source).returning();
    return newSource;
  }

  async getUserWatchlist(userId: string): Promise<Watchlist[]> {
    return await db.select().from(watchlists)
      .where(eq(watchlists.userId, userId))
      .orderBy(desc(watchlists.createdAt));
  }

  async addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist> {
    const [newWatchlist] = await db.insert(watchlists).values(watchlist).returning();
    return newWatchlist;
  }

  async removeFromWatchlist(userId: string, collectibleId: string): Promise<void> {
    await db.delete(watchlists)
      .where(and(
        eq(watchlists.userId, userId),
        eq(watchlists.collectibleId, collectibleId)
      ));
  }

  async getMarketStats(): Promise<{ totalItems: number, totalValue: string, activeListings: number }> {
    const [itemCount] = await db.select({ count: count() }).from(collectibles);
    
    const [valueResult] = await db.select({
      totalValue: sql<string>`COALESCE(SUM(${medianPrices.medianPrice} * ${medianPrices.activeListings}), 0)`
    }).from(medianPrices);
    
    const [listingsResult] = await db.select({
      totalListings: sql<number>`COALESCE(SUM(${medianPrices.activeListings}), 0)`
    }).from(medianPrices);

    return {
      totalItems: itemCount.count,
      totalValue: valueResult.totalValue || "0",
      activeListings: listingsResult.totalListings || 0
    };
  }

  async getTopMovers(
    categoryId: string, 
    startDate: Date, 
    endDate: Date, 
    direction: 'gainers' | 'losers', 
    limit = 10
  ): Promise<Array<{
    id: string;
    name: string;
    brand?: string;
    currentPrice: number;
    previousPrice: number;
    priceChange: number;
    percentageChange: number;
    activeListings: number;
  }>> {
    // Get collectibles in category with recent prices
    const results = await db.select({
      collectible: collectibles,
      currentPrice: sql<number>`MAX(CASE WHEN ${medianPrices.date} >= ${endDate}::date - interval '3 days' THEN ${medianPrices.medianPrice} END)`,
      previousPrice: sql<number>`MIN(CASE WHEN ${medianPrices.date} >= ${startDate}::date AND ${medianPrices.date} <= ${startDate}::date + interval '3 days' THEN ${medianPrices.medianPrice} END)`,
      activeListings: sql<number>`MAX(${medianPrices.activeListings})`
    })
    .from(collectibles)
    .leftJoin(medianPrices, eq(collectibles.id, medianPrices.collectibleId))
    .where(and(
      eq(collectibles.categoryId, categoryId),
      gte(medianPrices.date, startDate),
      lte(medianPrices.date, endDate),
      gte(medianPrices.activeListings, 3) // Minimum liquidity filter
    ))
    .groupBy(collectibles.id, collectibles.name, collectibles.brand)
    .having(sql`COUNT(${medianPrices.id}) >= 2`) // Need at least 2 data points
    .limit(limit * 2); // Get extra to filter out invalid calculations

    // Calculate percentage changes and filter
    const movers = results
      .map(row => {
        const current = Number(row.currentPrice) || 0;
        const previous = Number(row.previousPrice) || 0;
        
        if (previous === 0 || current === 0) return null;
        
        const priceChange = current - previous;
        const percentageChange = (priceChange / previous) * 100;
        
        return {
          id: row.collectible.id,
          name: row.collectible.name,
          brand: row.collectible.brand || undefined,
          currentPrice: current,
          previousPrice: previous,
          priceChange,
          percentageChange,
          activeListings: Number(row.activeListings) || 0
        };
      })
      .filter((item): item is NonNullable<typeof item> => {
        if (!item) return false;
        // Filter by direction and ensure meaningful change
        if (direction === 'gainers') {
          return item.percentageChange > 0.1; // At least 0.1% gain
        } else {
          return item.percentageChange < -0.1; // At least 0.1% loss
        }
      })
      .sort((a, b) => {
        if (direction === 'gainers') {
          return b.percentageChange - a.percentageChange;
        } else {
          return a.percentageChange - b.percentageChange;
        }
      })
      .slice(0, limit);

    return movers;
  }

  async getTopPerformers(
    categoryId: string, 
    startDate: Date, 
    endDate: Date, 
    limit = 10
  ): Promise<Array<{
    id: string;
    name: string;
    brand?: string;
    currentPrice: number;
    priceChange: number;
    percentageChange: number;
    activeListings: number;
    volume: number;
  }>> {
    // Get top performers by combining price performance and volume
    const results = await db.select({
      collectible: collectibles,
      currentPrice: sql<number>`MAX(CASE WHEN ${medianPrices.date} >= ${endDate}::date - interval '3 days' THEN ${medianPrices.medianPrice} END)`,
      previousPrice: sql<number>`MIN(CASE WHEN ${medianPrices.date} >= ${startDate}::date AND ${medianPrices.date} <= ${startDate}::date + interval '3 days' THEN ${medianPrices.medianPrice} END)`,
      activeListings: sql<number>`MAX(${medianPrices.activeListings})`,
      avgPrice: sql<number>`AVG(${medianPrices.medianPrice})`,
      totalListings: sql<number>`SUM(${medianPrices.activeListings})`
    })
    .from(collectibles)
    .leftJoin(medianPrices, eq(collectibles.id, medianPrices.collectibleId))
    .where(and(
      eq(collectibles.categoryId, categoryId),
      gte(medianPrices.date, startDate),
      lte(medianPrices.date, endDate),
      gte(medianPrices.activeListings, 5) // Higher liquidity filter for top performers
    ))
    .groupBy(collectibles.id, collectibles.name, collectibles.brand)
    .having(sql`COUNT(${medianPrices.id}) >= 3`) // Need more data points for top performers
    .limit(limit * 2);

    // Calculate performance metrics
    const performers = results
      .map(row => {
        const current = Number(row.currentPrice) || 0;
        const previous = Number(row.previousPrice) || 0;
        const avgPrice = Number(row.avgPrice) || 0;
        const totalListings = Number(row.totalListings) || 0;
        
        if (previous === 0 || current === 0 || avgPrice === 0) return null;
        
        const priceChange = current - previous;
        const percentageChange = (priceChange / previous) * 100;
        const volume = avgPrice * totalListings; // Rough volume estimate
        
        return {
          id: row.collectible.id,
          name: row.collectible.name,
          brand: row.collectible.brand || undefined,
          currentPrice: current,
          priceChange,
          percentageChange,
          activeListings: Number(row.activeListings) || 0,
          volume
        };
      })
      .filter((item): item is NonNullable<typeof item> => {
        return item !== null && item.volume > 0;
      })
      .sort((a, b) => {
        // Sort by a combination of performance and volume
        const scoreA = a.percentageChange * Math.log(a.volume + 1);
        const scoreB = b.percentageChange * Math.log(b.volume + 1);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return performers;
  }

  async getCategoryFacets(categoryId: string): Promise<{
    brands: Array<{ name: string; count: number }>;
    sports: Array<{ name: string; count: number }>;
    eras: Array<{ name: string; count: number; range: string }>;
  }> {
    // Get brand counts
    const brandResults = await db.select({
      brand: collectibles.brand,
      count: count()
    })
    .from(collectibles)
    .where(and(
      eq(collectibles.categoryId, categoryId),
      sql`${collectibles.brand} IS NOT NULL AND ${collectibles.brand} != ''`
    ))
    .groupBy(collectibles.brand)
    .orderBy(desc(count()))
    .limit(20);

    const brands = brandResults.map(row => ({
      name: row.brand || 'Unknown',
      count: row.count
    }));

    // Get category-specific sports/subcategories based on the category type
    const categoryResult = await db.select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    
    const categoryName = categoryResult[0]?.name || '';
    
    let sportsKeywords: string[] = [];
    
    // Define category-specific keywords
    if (categoryName.toLowerCase().includes('trading') || categoryName.toLowerCase().includes('card')) {
      sportsKeywords = ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'Pokemon', 'Magic', 'Yu-Gi-Oh'];
    } else if (categoryName.toLowerCase().includes('sports')) {
      sportsKeywords = ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'Golf', 'Tennis', 'Boxing'];
    } else if (categoryName.toLowerCase().includes('vinyl') || categoryName.toLowerCase().includes('records')) {
      sportsKeywords = ['Rock', 'Jazz', 'Blues', 'Classical', 'Pop', 'Hip Hop', 'Country', 'Electronic'];
    } else if (categoryName.toLowerCase().includes('watch')) {
      sportsKeywords = ['Luxury', 'Sport', 'Dress', 'Dive', 'Aviation', 'Racing', 'Military'];
    } else {
      // For other categories, use generic subcategories
      sportsKeywords = ['Vintage', 'Modern', 'Limited Edition', 'Rare', 'Premium'];
    }
    
    const sportsPromises = sportsKeywords.map(async sport => {
      const [result] = await db.select({
        count: count()
      })
      .from(collectibles)
      .where(and(
        eq(collectibles.categoryId, categoryId),
        sql`${collectibles.name} ILIKE ${`%${sport}%`} OR ${collectibles.brand} ILIKE ${`%${sport}%`} OR ${collectibles.model} ILIKE ${`%${sport}%`}`
      ));
      
      return {
        name: sport,
        count: result.count
      };
    });

    const sports = (await Promise.all(sportsPromises))
      .filter(sport => sport.count > 0)
      .sort((a, b) => b.count - a.count);

    // Get era counts based on year
    const eraResults = await db.select({
      year: collectibles.year,
      count: count()
    })
    .from(collectibles)
    .where(and(
      eq(collectibles.categoryId, categoryId),
      sql`${collectibles.year} IS NOT NULL`
    ))
    .groupBy(collectibles.year);

    // Group into eras
    const eraMap = new Map<string, { count: number; range: string }>();
    eraResults.forEach(row => {
      const year = row.year || 0;
      let era: string, range: string;
      
      if (year < 1970) {
        era = 'Vintage';
        range = 'Pre-1970';
      } else if (year < 1990) {
        era = 'Classic';
        range = '1970-1989';
      } else if (year < 2010) {
        era = 'Modern';
        range = '1990-2009';
      } else {
        era = 'Contemporary';
        range = '2010+';
      }
      
      const existing = eraMap.get(era) || { count: 0, range };
      eraMap.set(era, { count: existing.count + row.count, range });
    });

    const eras = Array.from(eraMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      range: data.range
    }));

    return { brands, sports, eras };
  }
}

export const storage = new DatabaseStorage();
