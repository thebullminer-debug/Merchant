import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCollectibleSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(category);
      res.json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Collectibles
  app.get("/api/collectibles", async (req, res) => {
    try {
      const { categoryId, limit, offset } = req.query;
      const collectibles = await storage.getCollectibles(
        categoryId as string,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(collectibles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collectibles" });
    }
  });

  app.get("/api/collectibles/trending", async (req, res) => {
    try {
      const { limit } = req.query;
      const trending = await storage.getTrendingCollectibles(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(trending);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending collectibles" });
    }
  });

  app.get("/api/collectibles/search", async (req, res) => {
    try {
      const { q, categoryId } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await storage.searchCollectibles(q, categoryId as string);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search collectibles" });
    }
  });

  app.get("/api/collectibles/:id", async (req, res) => {
    try {
      const collectible = await storage.getCollectible(req.params.id);
      if (!collectible) {
        return res.status(404).json({ message: "Collectible not found" });
      }
      res.json(collectible);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collectible" });
    }
  });

  app.post("/api/collectibles", async (req, res) => {
    try {
      const collectible = insertCollectibleSchema.parse(req.body);
      const newCollectible = await storage.createCollectible(collectible);
      res.json(newCollectible);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid collectible data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create collectible" });
      }
    }
  });

  // Price data
  app.get("/api/collectibles/:id/prices", async (req, res) => {
    try {
      const { days } = req.query;
      const prices = await storage.getMedianPrices(
        req.params.id,
        days ? parseInt(days as string) : undefined
      );
      res.json(prices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price data" });
    }
  });

  app.get("/api/collectibles/:id/current-price", async (req, res) => {
    try {
      const currentPrice = await storage.getCurrentPrice(req.params.id);
      if (!currentPrice) {
        return res.status(404).json({ message: "No price data available" });
      }
      res.json(currentPrice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current price" });
    }
  });

  // Market stats
  app.get("/api/market/stats", async (_req, res) => {
    try {
      const stats = await storage.getMarketStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market stats" });
    }
  });

  // Price alerts (recent price movements)
  app.get("/api/price-alerts", async (_req, res) => {
    try {
      // Get recent significant price changes
      const trending = await storage.getTrendingCollectibles(10);
      const alerts = trending
        .filter(item => Math.abs(item.priceChange || 0) > 1)
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          name: item.name,
          change: item.priceChange,
          currentPrice: item.currentPrice,
          time: "Recent"
        }));
      
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price alerts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
