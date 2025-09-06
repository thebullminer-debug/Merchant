import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
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

export const medianPrices = pgTable("median_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectibleId: varchar("collectible_id").references(() => collectibles.id),
  date: timestamp("date").notNull(),
  medianPrice: decimal("median_price", { precision: 10, scale: 2 }).notNull(),
  activeListings: integer("active_listings").default(0),
  priceRange: jsonb("price_range").$type<{min: number, max: number}>(),
  dayChange: decimal("day_change", { precision: 5, scale: 2 }), // percentage change
  calculatedAt: timestamp("calculated_at").defaultNow(),
}, (table) => ({
  collectibleIdx: index("median_prices_collectible_idx").on(table.collectibleId),
  dateIdx: index("median_prices_date_idx").on(table.date),
}));

export const watchlists = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  collectibleId: varchar("collectible_id").references(() => collectibles.id),
  alertPrice: decimal("alert_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

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
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  collectible: one(collectibles, {
    fields: [priceHistory.collectibleId],
    references: [collectibles.id],
  }),
}));

export const medianPricesRelations = relations(medianPrices, ({ one }) => ({
  collectible: one(collectibles, {
    fields: [medianPrices.collectibleId],
    references: [collectibles.id],
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

export const insertMedianPriceSchema = createInsertSchema(medianPrices).omit({
  id: true,
  calculatedAt: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlists).omit({
  id: true,
  createdAt: true,
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

export type MedianPrice = typeof medianPrices.$inferSelect;
export type InsertMedianPrice = z.infer<typeof insertMedianPriceSchema>;

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
