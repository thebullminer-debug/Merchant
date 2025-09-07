import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCollectibleSchema, insertCategorySchema } from "@shared/schema";
import { marketplaceScraperService } from "./services/marketplace-scraper";
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

  // Marketplace data endpoints
  app.get("/api/markets", async (req, res) => {
    try {
      const { category, sort } = req.query;
      const collectibles = await storage.getCollectibles(category as string);
      
      // Add mock market data for demo
      const marketData = collectibles.map(item => ({
        ...item,
        currentPrice: Math.floor(Math.random() * 50000) + 1000,
        priceChange: (Math.random() - 0.5) * 20,
        marketCap: Math.floor(Math.random() * 1000000) + 100000,
        volume24h: Math.floor(Math.random() * 100000) + 10000
      }));

      res.json(marketData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const stats = await storage.getMarketStats();
      
      // Mock analytics data
      const overview = {
        totalMarketCap: parseFloat(stats.totalValue) || 5000000,
        totalVolume24h: 850000,
        avgPriceChange: 2.3,
        activeListings: stats.totalItems || 0,
        topGainers: [
          { id: '1', name: 'Rolex Submariner', priceChange: 8.5, currentPrice: 12500 },
          { id: '2', name: 'Mickey Mantle 1952', priceChange: 6.2, currentPrice: 95000 }
        ],
        topLosers: [
          { id: '3', name: 'Pokemon Charizard', priceChange: -3.1, currentPrice: 8500 }
        ]
      };

      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/analytics/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      
      // Mock category stats
      const categoryStats = categories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        marketCap: Math.floor(Math.random() * 2000000) + 500000,
        volume24h: Math.floor(Math.random() * 200000) + 50000,
        priceChange: (Math.random() - 0.5) * 15,
        itemCount: Math.floor(Math.random() * 50) + 10
      }));

      res.json(categoryStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category analytics" });
    }
  });

  // Real-time price update endpoint
  app.post("/api/collectibles/:id/update-price", async (req, res) => {
    try {
      const result = await marketplaceScraperService.updateSpecificCollectible(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update prices" });
    }
  });

  // Watchlist endpoints
  app.get("/api/watchlist", async (req, res) => {
    try {
      // Mock watchlist data for now
      const watchlist = [
        { id: '1', collectibleId: '30ede095-8a47-43d4-9178-88509239a07a', addedAt: new Date() },
        { id: '2', collectibleId: 'dcbce0d4-1ffb-4dd0-8d32-20cd81095a21', addedAt: new Date() }
      ];
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist/:id", async (req, res) => {
    try {
      // Mock add to watchlist
      res.json({ success: true, message: "Added to watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:id", async (req, res) => {
    try {
      // Mock remove from watchlist
      res.json({ success: true, message: "Removed from watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // Seed database endpoint (for development)
  app.post("/api/seed", async (_req, res) => {
    try {
      const { quickSeed } = await import("./simple-seed");
      const success = await quickSeed();
      if (success) {
        res.json({ message: "Database seeded successfully" });
      } else {
        res.status(500).json({ message: "Seeding partially failed" });
      }
    } catch (error) {
      console.error("Seeding error:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Comprehensive seed endpoint
  app.post("/api/seed-comprehensive", async (_req, res) => {
    try {
      const { seedDatabase } = await import("./seed-data");
      await seedDatabase();
      res.json({ message: "Comprehensive database seeded successfully" });
    } catch (error) {
      console.error("Comprehensive seeding error:", error);
      res.status(500).json({ message: "Failed to seed comprehensive database" });
    }
  });

  // Portfolio endpoints
  app.get("/api/portfolio", async (_req, res) => {
    try {
      // Mock portfolio data for now
      const portfolio = [
        {
          id: "1",
          collectibleId: "30ede095-8a47-43d4-9178-88509239a07a", 
          collectible: {
            id: "30ede095-8a47-43d4-9178-88509239a07a",
            name: "Rolex Submariner Date",
            description: "Iconic diving watch",
            categoryId: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
            brand: "Rolex",
            model: "126610LN",
            year: 2020,
            condition: "Excellent",
            imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            tags: ["luxury", "diving"],
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          purchasePrice: 11500,
          purchaseDate: "2023-06-15",
          quantity: 1,
          currentPrice: 12800,
          totalValue: 12800,
          gain: 1300,
          gainPercent: 11.3
        }
      ];
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.get("/api/portfolio/stats", async (_req, res) => {
    try {
      const stats = {
        totalValue: 137800,
        totalGain: 31300,
        totalGainPercent: 29.4,
        totalInvested: 106500,
        itemCount: 2
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio stats" });
    }
  });

  app.post("/api/portfolio", async (req, res) => {
    try {
      // Mock add to portfolio
      const { collectibleId, purchasePrice, quantity, purchaseDate } = req.body;
      res.json({ 
        success: true, 
        message: "Added to portfolio",
        item: { collectibleId, purchasePrice, quantity, purchaseDate }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to portfolio" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
