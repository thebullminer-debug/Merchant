import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  description: text("description"),
});

export const collectibles = pgTable("collectibles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  brand: text("brand"),
  model: text("model"),
  year: integer("year"),
  condition: text("condition"),
  imageUrl: text("image_url"),
  tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("collectibles_name_idx").on(table.name),
  categoryIdx: index("collectibles_category_idx").on(table.categoryId),
  brandIdx: index("collectibles_brand_idx").on(table.brand),
}));

export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectibleId: varchar("collectible_id").references(() => collectibles.id),
  source: text("source").notNull(), // marketplace name
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  listingUrl: text("listing_url"),
  condition: text("condition"),
  isActive: integer("is_active").default(1), // 1 = active listing, 0 = sold/expired
  scrapedAt: timestamp("scraped_at").defaultNow(),
}, (table) => ({
  collectibleIdx: index("price_history_collectible_idx").on(table.collectibleId),
  dateIdx: index("price_history_date_idx").on(table.scrapedAt),
  sourceIdx: index("price_history_source_idx").on(table.source),
}));

export const priceSources = pgTable("price_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // "PSA", "VCP", "SportsCardsPro", "eBay", "Heritage"
  type: text("type").notNull(), // "api", "scraper", "manual", "import"
  baseUrl: text("base_url"),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medianPrices = pgTable("median_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectibleId: varchar("collectible_id").references(() => collectibles.id),
  date: timestamp("date").notNull(),
  medianPrice: decimal("median_price", { precision: 12, scale: 2 }).notNull(), // Increased precision for historical values
  activeListings: integer("active_listings").default(0),
  priceRange: jsonb("price_range"),
  dayChange: decimal("day_change", { precision: 5, scale: 2 }), // percentage change
  sourceId: varchar("source_id").references(() => priceSources.id),
  granularity: text("granularity").default("day"), // "day", "month", "year"
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"), // 0.00-1.00 for historical estimates
  currency: text("currency").default("USD"),
  inflationAdjusted: integer("inflation_adjusted").default(0), // 0 = nominal, 1 = real/adjusted
  calculatedAt: timestamp("calculated_at").defaultNow(),
}, (table) => ({
  collectibleIdx: index("median_prices_collectible_idx").on(table.collectibleId),
  dateIdx: index("median_prices_date_idx").on(table.date),
  sourceIdx: index("median_prices_source_idx").on(table.sourceId),
  // Unique constraint to prevent duplicates for same collectible+date+source+granularity
  uniquePrice: index("median_prices_unique_idx").on(table.collectibleId, table.date, table.sourceId, table.granularity),
}));

export const watchlists = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  collectibleId: varchar("collectible_id").references(() => collectibles.id),
  alertPrice: decimal("alert_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Raw trade/transaction data for OHLCV aggregation
export const ticks = pgTable("ticks", {
  id: varchar("id", { length: 255 }).primaryKey().notNull().$defaultFn(() => nanoid()),
  collectibleId: varchar("collectible_id", { length: 255 }).notNull(),
  sourceId: varchar("source_id", { length: 255 }).notNull(),
  timestampUTC: timestamp("timestamp_utc").notNull(),
  priceUSD: decimal("price_usd", { precision: 12, scale: 2 }).notNull(),
  condition: text("condition"),
  currency: text("currency").default("USD"),
  feesIncluded: boolean("fees_included").default(false),
  quantity: integer("quantity").default(1),
  isEstimate: boolean("is_estimate").default(false),
  listingUrl: text("listing_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  collectibleIdx: index("ticks_collectible_idx").on(table.collectibleId),
  timestampIdx: index("ticks_timestamp_idx").on(table.timestampUTC),
  sourceIdx: index("ticks_source_idx").on(table.sourceId),
  uniqueTick: index("ticks_unique_idx").on(table.collectibleId, table.sourceId, table.timestampUTC, table.priceUSD),
}));

// OHLCV candle data for stock-style charts
export const candles = pgTable("candles", {
  id: varchar("id", { length: 255 }).primaryKey().notNull().$defaultFn(() => nanoid()),
  collectibleId: varchar("collectible_id", { length: 255 }).notNull(),
  startUTC: timestamp("start_utc").notNull(),
  interval: text("interval").notNull(), // '5m', '1h', '4h', '1d', '1w', '1mo'
  open: decimal("open", { precision: 12, scale: 2 }).notNull(),
  high: decimal("high", { precision: 12, scale: 2 }).notNull(),
  low: decimal("low", { precision: 12, scale: 2 }).notNull(),
  close: decimal("close", { precision: 12, scale: 2 }).notNull(),
  volume: decimal("volume", { precision: 15, scale: 2 }).default("0"),
  observedCount: integer("observed_count").default(0),
  interpolatedCount: integer("interpolated_count").default(0),
  quality: text("quality").default("observed"), // 'observed', 'interpolated', 'aggregated'
  calculatedAt: timestamp("calculated_at").defaultNow(),
}, (table) => ({
  collectibleIdx: index("candles_collectible_idx").on(table.collectibleId),
  intervalIdx: index("candles_interval_idx").on(table.interval),
  startIdx: index("candles_start_idx").on(table.startUTC),
  uniqueCandle: index("candles_unique_idx").on(table.collectibleId, table.interval, table.startUTC),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  watchlists: many(watchlists),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  collectibles: many(collectibles),
}));

export const collectiblesRelations = relations(collectibles, ({ one, many }) => ({
  category: one(categories, {
    fields: [collectibles.categoryId],
    references: [categories.id],
  }),
  priceHistory: many(priceHistory),
  medianPrices: many(medianPrices),
  watchlists: many(watchlists),
  ticks: many(ticks),
  candles: many(candles),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  collectible: one(collectibles, {
    fields: [priceHistory.collectibleId],
    references: [collectibles.id],
  }),
}));

export const priceSourcesRelations = relations(priceSources, ({ many }) => ({
  medianPrices: many(medianPrices),
}));

export const medianPricesRelations = relations(medianPrices, ({ one }) => ({
  collectible: one(collectibles, {
    fields: [medianPrices.collectibleId],
    references: [collectibles.id],
  }),
  source: one(priceSources, {
    fields: [medianPrices.sourceId],
    references: [priceSources.id],
  }),
}));

export const watchlistsRelations = relations(watchlists, ({ one }) => ({
  user: one(users, {
    fields: [watchlists.userId],
    references: [users.id],
  }),
  collectible: one(collectibles, {
    fields: [watchlists.collectibleId],
    references: [collectibles.id],
  }),
}));

export const ticksRelations = relations(ticks, ({ one }) => ({
  collectible: one(collectibles, {
    fields: [ticks.collectibleId],
    references: [collectibles.id],
  }),
  source: one(priceSources, {
    fields: [ticks.sourceId],
    references: [priceSources.id],
  }),
}));

export const candlesRelations = relations(candles, ({ one }) => ({
  collectible: one(collectibles, {
    fields: [candles.collectibleId],
    references: [collectibles.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertCollectibleSchema = createInsertSchema(collectibles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
  scrapedAt: true,
});

export const insertPriceSourceSchema = createInsertSchema(priceSources).omit({
  id: true,
  createdAt: true,
});

export const insertMedianPriceSchema = createInsertSchema(medianPrices).omit({
  id: true,
  calculatedAt: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlists).omit({
  id: true,
  createdAt: true,
});

export const insertTickSchema = createInsertSchema(ticks).omit({
  id: true,
  createdAt: true,
});

export const insertCandleSchema = createInsertSchema(candles).omit({
  id: true,
  calculatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Collectible = typeof collectibles.$inferSelect;
export type InsertCollectible = z.infer<typeof insertCollectibleSchema>;

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;

export type PriceSource = typeof priceSources.$inferSelect;
export type InsertPriceSource = z.infer<typeof insertPriceSourceSchema>;

export type MedianPrice = typeof medianPrices.$inferSelect;
export type InsertMedianPrice = z.infer<typeof insertMedianPriceSchema>;

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type Tick = typeof ticks.$inferSelect;
export type InsertTick = z.infer<typeof insertTickSchema>;

export type Candle = typeof candles.$inferSelect;
export type InsertCandle = z.infer<typeof insertCandleSchema>;

// Analytics types
export const marketAnalyticsSchema = z.object({
  period: z.string(),
  subcategories: z.object({
    brands: z.array(z.object({
      name: z.string(),
      count: z.number()
    })),
    sports: z.array(z.object({
      name: z.string(), 
      count: z.number()
    })),
    eras: z.array(z.object({
      name: z.string(),
      count: z.number(),
      range: z.string()
    }))
  }),
  topPerformers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string().optional(),
    currentPrice: z.number(),
    priceChange: z.number(),
    percentageChange: z.number(),
    activeListings: z.number(),
    volume: z.number()
  })),
  topGainers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string().optional(),
    currentPrice: z.number(),
    previousPrice: z.number(),
    priceChange: z.number(),
    percentageChange: z.number(),
    activeListings: z.number()
  })),
  topLosers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string().optional(),
    currentPrice: z.number(),
    previousPrice: z.number(),
    priceChange: z.number(),
    percentageChange: z.number(),
    activeListings: z.number()
  })),
  metadata: z.object({
    startDate: z.string(),
    endDate: z.string(),
    totalResults: z.object({
      performers: z.number(),
      gainers: z.number(),
      losers: z.number()
    })
  })
});

export type MarketAnalytics = z.infer<typeof marketAnalyticsSchema>;
