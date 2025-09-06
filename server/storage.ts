import { 
  users, collectibles, categories, priceHistory, medianPrices, watchlists,
  type User, type InsertUser, 
  type Collectible, type InsertCollectible,
  type Category, type InsertCategory,
  type PriceHistory, type InsertPriceHistory,
  type MedianPrice, type InsertMedianPrice,
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
  addMedianPrice(medianPrice: InsertMedianPrice): Promise<MedianPrice>;
  getCurrentPrice(collectibleId: string): Promise<{ price: number, change: number, activeListings: number } | null>;

  // Watchlist operations
  getUserWatchlist(userId: string): Promise<Watchlist[]>;
  addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: string, collectibleId: string): Promise<void>;

  // Market stats
  getMarketStats(): Promise<{ totalItems: number, totalValue: string, activeListings: number }>;
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
    const query = db.select().from(collectibles);
    
    if (categoryId) {
      query.where(eq(collectibles.categoryId, categoryId));
    }
    
    return await query
      .orderBy(desc(collectibles.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCollectible(id: string): Promise<Collectible | undefined> {
    const [collectible] = await db.select().from(collectibles).where(eq(collectibles.id, id));
    return collectible || undefined;
  }

  async searchCollectibles(query: string, categoryId?: string): Promise<Collectible[]> {
    let dbQuery = db.select().from(collectibles)
      .where(sql`${collectibles.name} ILIKE ${`%${query}%`} OR ${collectibles.brand} ILIKE ${`%${query}%`} OR ${collectibles.model} ILIKE ${`%${query}%`}`);
    
    if (categoryId) {
      dbQuery = dbQuery.where(and(
        sql`${collectibles.name} ILIKE ${`%${query}%`} OR ${collectibles.brand} ILIKE ${`%${query}%`} OR ${collectibles.model} ILIKE ${`%${query}%`}`,
        eq(collectibles.categoryId, categoryId)
      ));
    }
    
    return await dbQuery.limit(20);
  }

  async createCollectible(collectible: InsertCollectible): Promise<Collectible> {
    const [newCollectible] = await db.insert(collectibles).values(collectible).returning();
    return newCollectible;
  }

  async updateCollectible(id: string, collectible: Partial<InsertCollectible>): Promise<Collectible> {
    const [updated] = await db.update(collectibles)
      .set({ ...collectible, updatedAt: new Date() })
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
    .leftJoin(medianPrices, eq(collectibles.id, medianPrices.collectibleId))
    .where(sql`${medianPrices.date} >= NOW() - INTERVAL '7 days'`)
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

  async addMedianPrice(medianPrice: InsertMedianPrice): Promise<MedianPrice> {
    const [newMedianPrice] = await db.insert(medianPrices).values(medianPrice).returning();
    return newMedianPrice;
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
}

export const storage = new DatabaseStorage();
