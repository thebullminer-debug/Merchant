import { db } from "../db";
import { ticks, candles, priceHistory, medianPrices, collectibles } from "@shared/schema";
import { storage } from "../storage";
import { eq, gte, lte, asc, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export class CandleAggregatorService {
  // Convert existing price_history data to OHLCV candles
  async aggregateHistoricalData(collectibleId: string, interval = '1d'): Promise<void> {
    console.log(`Starting OHLCV aggregation for collectible ${collectibleId}, interval: ${interval}`);
    
    // Get all price history for this collectible
    const priceData = await db.select()
      .from(priceHistory)
      .where(eq(priceHistory.collectibleId, collectibleId))
      .orderBy(asc(priceHistory.scrapedAt));

    if (priceData.length === 0) {
      console.log('No price data found for aggregation');
      return;
    }

    // Convert to ticks first (normalized format)
    const ticksData = priceData.map(price => ({
      collectibleId,
      sourceId: 'legacy-price-history',
      timestampUTC: price.scrapedAt || new Date(),
      priceUSD: price.price.toString(),
      condition: price.condition || 'Unknown',
      currency: price.currency || 'USD',
      feesIncluded: false,
      quantity: 1,
      isEstimate: false,
      listingUrl: price.listingUrl || null
    }));

    // Insert ticks for future aggregations
    try {
      await storage.addTicks(ticksData);
      console.log(`Inserted ${ticksData.length} ticks from historical price data`);
    } catch (error) {
      // Ignore duplicates
      console.log('Ticks already exist, skipping insertion');
    }

    // Group by time intervals and create OHLCV candles
    const candleMap = new Map<string, any>();

    for (const tick of ticksData) {
      const timestamp = new Date(tick.timestampUTC);
      const price = parseFloat(tick.priceUSD);
      
      // Round timestamp to interval boundary
      const intervalStart = this.roundToInterval(timestamp, interval);
      const key = `${intervalStart.toISOString()}-${interval}`;

      if (!candleMap.has(key)) {
        candleMap.set(key, {
          collectibleId,
          startUTC: intervalStart,
          interval,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: price, // Simple volume calculation
          observedCount: 1,
          interpolatedCount: 0,
          quality: 'observed'
        });
      } else {
        const candle = candleMap.get(key);
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price; // Last price in interval
        candle.volume += price;
        candle.observedCount += 1;
      }
    }

    // Insert candles into database
    const candlesToInsert = Array.from(candleMap.values());
    
    for (const candleData of candlesToInsert) {
      try {
        await storage.addCandle(candleData);
      } catch (error) {
        // Ignore duplicates
        console.log(`Candle already exists for ${candleData.startUTC}`);
      }
    }

    console.log(`Created ${candlesToInsert.length} OHLCV candles for interval ${interval}`);
  }

  // Round timestamp to interval boundary
  private roundToInterval(timestamp: Date, interval: string): Date {
    const date = new Date(timestamp);
    
    switch (interval) {
      case '5m':
        date.setMinutes(Math.floor(date.getMinutes() / 5) * 5, 0, 0);
        break;
      case '1h':
        date.setMinutes(0, 0, 0);
        break;
      case '4h':
        date.setHours(Math.floor(date.getHours() / 4) * 4, 0, 0, 0);
        break;
      case '1d':
        date.setHours(0, 0, 0, 0);
        break;
      case '1w':
        const dayOfWeek = date.getDay();
        date.setDate(date.getDate() - dayOfWeek);
        date.setHours(0, 0, 0, 0);
        break;
      case '1mo':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
      default:
        // Default to daily
        date.setHours(0, 0, 0, 0);
    }
    
    return date;
  }

  // Aggregate all collectibles that have price data but no candles
  async aggregateAllCollectibles(): Promise<void> {
    console.log('Starting bulk OHLCV aggregation for all collectibles...');
    
    // Get collectibles with price data but no candles
    const collectiblesWithData = await db
      .select({ id: collectibles.id, name: collectibles.name })
      .from(collectibles)
      .leftJoin(priceHistory, eq(collectibles.id, priceHistory.collectibleId))
      .leftJoin(candles, eq(collectibles.id, candles.collectibleId))
      .where(sql`${priceHistory.collectibleId} IS NOT NULL AND ${candles.collectibleId} IS NULL`)
      .groupBy(collectibles.id, collectibles.name);

    console.log(`Found ${collectiblesWithData.length} collectibles needing OHLCV aggregation`);

    for (const collectible of collectiblesWithData) {
      try {
        await this.aggregateHistoricalData(collectible.id, '1d');
        console.log(`✅ Completed aggregation for ${collectible.name}`);
        
        // Small delay to be gentle on the database
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to aggregate ${collectible.name}:`, error);
      }
    }

    console.log('Bulk OHLCV aggregation completed!');
  }

  // Real-time aggregation for new tick data
  async aggregateLatestTicks(collectibleId: string, interval = '1d'): Promise<void> {
    console.log(`Aggregating latest ticks for ${collectibleId}`);
    
    // Get recent ticks that haven't been aggregated yet
    const recentTicks = await db
      .select()
      .from(ticks)
      .where(eq(ticks.collectibleId, collectibleId))
      .orderBy(desc(ticks.timestampUTC))
      .limit(100);

    if (recentTicks.length === 0) {
      console.log('No recent ticks to aggregate');
      return;
    }

    // Use the same aggregation logic as historical data
    const candleMap = new Map<string, any>();

    for (const tick of recentTicks) {
      const timestamp = new Date(tick.timestampUTC);
      const price = parseFloat(tick.priceUSD);
      
      const intervalStart = this.roundToInterval(timestamp, interval);
      const key = `${intervalStart.toISOString()}-${interval}`;

      if (!candleMap.has(key)) {
        candleMap.set(key, {
          collectibleId,
          startUTC: intervalStart,
          interval,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: price,
          observedCount: 1,
          interpolatedCount: 0,
          quality: 'observed'
        });
      } else {
        const candle = candleMap.get(key);
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
        candle.volume += price;
        candle.observedCount += 1;
      }
    }

    // Upsert candles (update existing or insert new)
    const candlesToUpsert = Array.from(candleMap.values());
    
    for (const candleData of candlesToUpsert) {
      try {
        // Check if candle exists
        const existingCandle = await db
          .select()
          .from(candles)
          .where(sql`${candles.collectibleId} = ${candleData.collectibleId} 
                     AND ${candles.interval} = ${candleData.interval} 
                     AND ${candles.startUTC} = ${candleData.startUTC}`)
          .limit(1);

        if (existingCandle.length > 0) {
          // Update existing candle
          await db
            .update(candles)
            .set({
              high: candleData.high.toString(),
              low: candleData.low.toString(),
              close: candleData.close.toString(),
              volume: candleData.volume.toString(),
              observedCount: candleData.observedCount
            })
            .where(sql`${candles.collectibleId} = ${candleData.collectibleId} 
                       AND ${candles.interval} = ${candleData.interval} 
                       AND ${candles.startUTC} = ${candleData.startUTC}`);
        } else {
          // Insert new candle
          await storage.addCandle(candleData);
        }
      } catch (error) {
        console.error(`Error upserting candle:`, error);
      }
    }

    console.log(`Updated/created ${candlesToUpsert.length} candles from latest ticks`);
  }
}

export const candleAggregatorService = new CandleAggregatorService();