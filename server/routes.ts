import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCollectibleSchema, insertCategorySchema, insertMedianPriceSchema } from "@shared/schema";
import { marketplaceScraperService } from "./services/marketplace-scraper";
import { addVinylRecords } from "./simple-vinyl-seed";
import { dailyPriceService } from "./services/daily-price-service";
import { ResamplingService } from "./services/resamplingService.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize services
  const resamplingService = new ResamplingService(storage);
  
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
      const { days, start, end, granularity, source } = req.query;
      
      // Enhanced endpoint: support both legacy 'days' and new date range queries
      if (start || end) {
        // Date range query
        const startDate = start ? new Date(start as string) : new Date('1952-01-01');
        const endDate = end ? new Date(end as string) : new Date();
        
        const prices = await storage.getMedianPricesRange(
          req.params.id,
          startDate,
          endDate,
          granularity as string,
          source as string
        );
        res.json(prices);
      } else if (days) {
        // Convert days-based query to date range query (more reliable)
        const daysNum = parseInt(days as string);
        const endDate = new Date();
        const startDate = new Date(endDate);
        
        if (daysNum === 999) {
          // "ALL" timeframe - get all historical data
          startDate.setFullYear(1950); // Go back to 1950 to catch all historical data
        } else if (daysNum >= 3650) {
          // 10Y timeframe
          startDate.setFullYear(endDate.getFullYear() - 10);
          startDate.setMonth(endDate.getMonth());
          startDate.setDate(endDate.getDate());
        } else if (daysNum >= 1825) {
          // 5Y timeframe
          startDate.setFullYear(endDate.getFullYear() - 5);
          startDate.setMonth(endDate.getMonth());
          startDate.setDate(endDate.getDate());
        } else if (daysNum >= 90) {
          // 3M+ timeframes: use proper month calculation to avoid date overflow
          const months = Math.floor(daysNum / 30.44); // Average days per month
          startDate.setMonth(endDate.getMonth() - months);
        } else {
          // Short timeframes: safe to use setDate
          startDate.setDate(endDate.getDate() - daysNum);
        }
        
        // Use daily granularity for all timeframes except ALL to avoid mixing yearly/daily data
        const effectiveGranularity = daysNum === 999 ? undefined : 'day';
        
        const prices = await storage.getMedianPricesRange(
          req.params.id,
          startDate,
          endDate,
          effectiveGranularity,
          undefined  // Don't filter by source for days-based queries
        );
        
        // Defensive filter to ensure consistent granularity for non-ALL timeframes
        let filteredPrices = prices;
        if (effectiveGranularity === 'day') {
          const originalCount = prices.length;
          filteredPrices = prices.filter(p => p.granularity === 'day');
          if (filteredPrices.length < originalCount) {
            console.warn(`Granularity filter bypassed: removed ${originalCount - filteredPrices.length} non-daily records for ${daysNum}Y timeframe`);
            console.warn(`Removed records:`, prices.filter(p => p.granularity !== 'day').map(p => ({ date: p.date, granularity: p.granularity })));
          }
        }
        
        res.json(filteredPrices);
      } else {
        // Default to recent data if no parameters
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 30); // Default to 30 days
        
        const prices = await storage.getMedianPricesRange(
          req.params.id,
          startDate,
          endDate,
          undefined, // Don't filter by granularity for default query
          undefined  // Don't filter by source for default query
        );
        res.json(prices);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price data" });
    }
  });

  // New resampled prices endpoint for better chart UX
  app.get("/api/collectibles/:id/prices/resampled", async (req, res) => {
    try {
      const { days, frequency, includeEstimates, maxPoints } = req.query;
      
      // Default values
      const daysNum = days ? parseInt(days as string) : 30;
      const targetFreq = (frequency as string) || 'day';
      const estimates = includeEstimates === 'true' ? true : false; // Default false - only real prices
      const maxPts = maxPoints ? parseInt(maxPoints as string) : 720;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate);
      
      if (daysNum === 999) {
        startDate.setFullYear(1950); // ALL timeframe
      } else if (daysNum >= 1825) {
        // 5Y: Set to January 1st of target year to include all historical data
        startDate.setFullYear(endDate.getFullYear() - 5);
        startDate.setMonth(0); // January
        startDate.setDate(1); // 1st
      } else if (daysNum === 366 || req.query.range === 'ytd') {
        // YTD: From January 1, 2025
        startDate.setFullYear(2025);
        startDate.setMonth(0); // January
        startDate.setDate(1); // 1st
      } else if (daysNum === 365) {
        // 1Y: Exactly 1 year back from today
        startDate.setFullYear(endDate.getFullYear() - 1);
        startDate.setMonth(endDate.getMonth());
        startDate.setDate(endDate.getDate());
      } else if (daysNum === 180) {
        // 6M: From March 1, 2025
        startDate.setFullYear(2025);
        startDate.setMonth(2); // March (0-indexed)
        startDate.setDate(1); // 1st
      } else if (daysNum >= 90) {
        const months = Math.floor(daysNum / 30.44);
        startDate.setMonth(endDate.getMonth() - months);
      } else {
        startDate.setDate(endDate.getDate() - daysNum);
      }

      // Normalize times to ensure boundary inclusiveness
      startDate.setUTCHours(0, 0, 0, 0); // Start of day
      endDate.setUTCHours(23, 59, 59, 999); // End of day

      const resampledData = await resamplingService.getResampledSeries(
        req.params.id,
        startDate,
        endDate,
        targetFreq as any,
        estimates,
        maxPts
      );

      res.json(resampledData);
    } catch (error) {
      console.error('Failed to fetch resampled price data:', error);
      res.status(500).json({ message: "Failed to fetch resampled price data" });
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

  // Market Analytics API - Trading Cards dashboard data
  app.get("/api/analytics/market", async (req, res) => {
    try {
      const { categoryId, period = "1M", limit = 10 } = req.query;

      // Validate required parameters
      if (!categoryId || typeof categoryId !== 'string') {
        return res.status(400).json({ message: "categoryId is required" });
      }

      // Map period to date ranges
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1D':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7D':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '1M':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '1Y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '5Y':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
        case '10Y':
          startDate.setFullYear(endDate.getFullYear() - 10);
          break;
        case 'ALL':
          startDate.setFullYear(1950); // Go back to beginning of data
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1); // Default to 1M
      }

      const limitNum = parseInt(limit as string) || 10;

      // Fetch analytics data
      const [subcategories, topPerformers, topGainers, topLosers] = await Promise.all([
        storage.getCategoryFacets(categoryId),
        storage.getTopPerformers(categoryId, startDate, endDate, limitNum),
        storage.getTopMovers(categoryId, startDate, endDate, 'gainers', limitNum),
        storage.getTopMovers(categoryId, startDate, endDate, 'losers', limitNum)
      ]);

      const analyticsData = {
        period,
        subcategories,
        topPerformers,
        topGainers,
        topLosers,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalResults: {
            performers: topPerformers.length,
            gainers: topGainers.length,
            losers: topLosers.length
          }
        }
      };

      res.json(analyticsData);
    } catch (error) {
      console.error("Market analytics error:", error);
      res.status(500).json({ message: "Failed to fetch market analytics" });
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

  // Vinyl records import from multiple sources
  app.post("/api/vinyl/import", async (_req, res) => {
    try {
      const success = await addVinylRecords();
      if (success) {
        res.json({ message: "Vinyl records imported successfully from multiple sources" });
      } else {
        res.status(500).json({ message: "Vinyl import partially failed" });
      }
    } catch (error) {
      console.error("Vinyl import error:", error);
      res.status(500).json({ message: "Failed to import vinyl records" });
    }
  });

  // Price sources
  app.get("/api/price-sources", async (_req, res) => {
    try {
      const sources = await storage.getPriceSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price sources" });
    }
  });

  // Bulk import historical prices
  app.post("/api/collectibles/:id/prices/bulk", async (req, res) => {
    try {
      const { prices } = req.body;
      if (!Array.isArray(prices)) {
        return res.status(400).json({ message: "Prices must be an array" });
      }

      // Add collectibleId and convert dates to proper Date objects
      const pricesWithId = prices.map(price => ({
        ...price,
        collectibleId: req.params.id,
        date: new Date(price.date), // Ensure date is converted to Date object
        medianPrice: parseFloat(price.medianPrice), // Ensure numeric values
        confidence: parseFloat(price.confidence),
        activeListings: parseInt(price.activeListings) || 0,
        inflationAdjusted: parseInt(price.inflationAdjusted) || 0
      }));

      const result = await storage.bulkInsertMedianPrices(pricesWithId);
      res.json({ 
        message: "Historical prices imported successfully",
        count: result.length 
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({ message: "Failed to import historical prices" });
    }
  });

  // Daily price updates
  app.post("/api/prices/update", async (_req, res) => {
    try {
      const results = await dailyPriceService.triggerManualUpdate();
      res.json({ 
        message: "Price update completed",
        updated: results.updated,
        errors: results.errors.length,
        details: results.errors.length > 0 ? results.errors.slice(0, 5) : undefined
      });
    } catch (error) {
      console.error("Price update error:", error);
      res.status(500).json({ message: "Failed to update prices" });
    }
  });

  // Price update status
  app.get("/api/prices/status", async (_req, res) => {
    try {
      const status = dailyPriceService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Status error:", error);
      res.status(500).json({ message: "Failed to get status" });
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

  // Advanced analytics endpoints
  app.get("/api/analytics/heatmap", async (_req, res) => {
    try {
      const heatmapData = [
        {
          id: "rolex-sub",
          name: "Rolex Submariner",
          category: "Watches",
          change: 15.2,
          value: 12800,
          volume: 1245
        },
        {
          id: "patek-nautilus", 
          name: "Patek Nautilus",
          category: "Watches",
          change: 28.5,
          value: 185000,
          volume: 892
        },
        {
          id: "lebron-rookie",
          name: "LeBron Rookie",
          category: "Cards",
          change: 22.3,
          value: 125000,
          volume: 567
        },
        {
          id: "mickey-mantle",
          name: "Mickey Mantle '52",
          category: "Cards", 
          change: -8.2,
          value: 425000,
          volume: 234
        },
        {
          id: "beatles-abbey",
          name: "Abbey Road",
          category: "Vinyl",
          change: -5.8,
          value: 850,
          volume: 123
        }
      ];
      
      res.json(heatmapData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch heatmap data" });
    }
  });

  app.get("/api/analytics/trends/:collectibleId", async (req, res) => {
    try {
      const { MarketAnalyzer } = await import("./services/market-analyzer");
      const { collectibleId } = req.params;
      
      // Generate realistic price data for trend analysis
      const priceData = Array.from({ length: 30 }, (_, i) => {
        const basePrice = 12000;
        const trend = i * 20; // Upward trend
        const noise = (Math.random() - 0.5) * 1000;
        return basePrice + trend + noise;
      });
      
      const volumeData = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 50);
      
      const trends = MarketAnalyzer.analyzeTrends(priceData, volumeData);
      const prediction = MarketAnalyzer.predictPriceDirection(priceData, volumeData);
      const alerts = MarketAnalyzer.generateAlerts(
        priceData[priceData.length - 1], 
        priceData, 
        volumeData[volumeData.length - 1], 
        120
      );
      
      res.json({
        collectibleId,
        trends,
        prediction,
        alerts,
        technicalIndicators: {
          rsi: 65.4,
          macd: 'bullish_crossover',
          bollingerBands: 'upper_channel',
          volumeProfile: 'above_average'
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trend analysis" });
    }
  });

  // Enhanced marketplace sources endpoints
  app.get("/api/sources", async (_req, res) => {
    try {
      const { sourceManager } = await import("./services/marketplace-sources");
      const sources = sourceManager.getAllActiveSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  app.get("/api/sources/health", async (_req, res) => {
    try {
      const { enhancedMarketplaceScraper } = await import("./services/enhanced-marketplace-scraper");
      const healthReport = await enhancedMarketplaceScraper.getSourceHealthReport();
      res.json(healthReport);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch source health" });
    }
  });

  app.get("/api/sources/category/:categorySlug", async (req, res) => {
    try {
      const { sourceManager } = await import("./services/marketplace-sources");
      const sources = sourceManager.getSourcesByCategory(req.params.categorySlug);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sources for category" });
    }
  });

  app.post("/api/collectibles/:id/scrape", async (req, res) => {
    try {
      const { enhancedMarketplaceScraper } = await import("./services/enhanced-marketplace-scraper");
      const { priority = 'medium' } = req.body;
      const jobId = await enhancedMarketplaceScraper.scheduleCollectibleScraping(req.params.id, priority);
      res.json({ jobId, message: "Scraping job scheduled" });
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule scraping" });
    }
  });

  app.post("/api/collectibles/:id/emergency-scrape", async (req, res) => {
    try {
      const { enhancedMarketplaceScraper } = await import("./services/enhanced-marketplace-scraper");
      const jobId = await enhancedMarketplaceScraper.triggerEmergencyScraping(req.params.id);
      res.json({ jobId, message: "Emergency scraping triggered" });
    } catch (error) {
      res.status(500).json({ message: "Failed to trigger emergency scraping" });
    }
  });

  app.get("/api/scraping/queue", async (_req, res) => {
    try {
      const { enhancedMarketplaceScraper } = await import("./services/enhanced-marketplace-scraper");
      const queueStatus = enhancedMarketplaceScraper.getQueueStatus();
      res.json(queueStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queue status" });
    }
  });

  app.get("/api/aggregation/:collectibleId", async (req, res) => {
    try {
      const { dataAggregator } = await import("./services/data-aggregator");
      const aggregatedData = await dataAggregator.aggregatePriceData(req.params.collectibleId);
      if (!aggregatedData) {
        return res.status(404).json({ message: "No aggregated data available" });
      }
      res.json(aggregatedData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch aggregated data" });
    }
  });

  app.post("/api/sources/:sourceId/pause", async (req, res) => {
    try {
      const { enhancedMarketplaceScraper } = await import("./services/enhanced-marketplace-scraper");
      enhancedMarketplaceScraper.pauseSource(req.params.sourceId);
      res.json({ message: `Source ${req.params.sourceId} paused` });
    } catch (error) {
      res.status(500).json({ message: "Failed to pause source" });
    }
  });

  app.post("/api/sources/:sourceId/resume", async (req, res) => {
    try {
      const { enhancedMarketplaceScraper } = await import("./services/enhanced-marketplace-scraper");
      enhancedMarketplaceScraper.resumeSource(req.params.sourceId);
      res.json({ message: `Source ${req.params.sourceId} resumed` });
    } catch (error) {
      res.status(500).json({ message: "Failed to resume source" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
