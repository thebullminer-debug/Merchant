import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { collectibles, priceHistory, medianPrices } from '@shared/schema';
import { db } from '../db';
import { eq, desc } from 'drizzle-orm';

interface MarketplaceData {
  price: number;
  source: string;
  condition: string;
  listingUrl: string;
  soldDate?: Date;
}

export class MarketplaceScraperService {
  private browser: Browser | null = null;

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeEbaySoldListings(searchQuery: string, limit = 20): Promise<MarketplaceData[]> {
    if (!this.browser) await this.init();
    
    const page = await this.browser!.newPage();
    const results: MarketplaceData[] = [];

    try {
      // Search eBay for sold listings
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=0&LH_Sold=1&LH_Complete=1&_ipg=48&_sop=13`;
      
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Extract sold listing data
      const listings = await page.evaluate(() => {
        const items = document.querySelectorAll('.s-item');
        const results: any[] = [];

        items.forEach((item, index) => {
          if (index >= 25) return; // Limit results
          
          const titleElement = item.querySelector('.s-item__title');
          const priceElement = item.querySelector('.s-item__price');
          const linkElement = item.querySelector('.s-item__link');
          const dateElement = item.querySelector('.s-item__endedDate');
          
          if (titleElement && priceElement && linkElement) {
            const title = titleElement.textContent?.trim() || '';
            const priceText = priceElement.textContent?.trim() || '';
            const url = linkElement.getAttribute('href') || '';
            const dateText = dateElement?.textContent?.trim() || '';
            
            // Extract price number
            const priceMatch = priceText.match(/\$[\d,]+\.?\d*/);
            const price = priceMatch ? parseFloat(priceMatch[0].replace(/[\$,]/g, '')) : 0;
            
            if (price > 0 && title && url) {
              results.push({
                price: price,
                source: 'eBay',
                condition: title.includes('mint') ? 'Mint' : 
                          title.includes('excellent') ? 'Excellent' : 
                          title.includes('good') ? 'Good' : 'Used',
                listingUrl: url,
                soldDate: dateText ? new Date(dateText) : new Date()
              });
            }
          }
        });

        return results;
      });

      results.push(...listings.slice(0, limit));
    } catch (error) {
      console.error('Error scraping eBay sold listings:', error);
    } finally {
      await page.close();
    }

    return results;
  }

  async updateCollectiblePrices() {
    console.log('Starting price update process...');
    
    // Get all collectibles
    const allCollectibles = await db.select().from(collectibles);

    for (const collectible of allCollectibles) {
      try {
        console.log(`Updating prices for: ${collectible.name}`);
        
        // Create search query for this specific collectible
        let searchQuery = `${collectible.name}`;
        if (collectible.brand) searchQuery = `${collectible.brand} ${searchQuery}`;
        if (collectible.model) searchQuery += ` ${collectible.model}`;
        if (collectible.year) searchQuery += ` ${collectible.year}`;

        // Add condition if specified
        if (collectible.condition) {
          searchQuery += ` ${collectible.condition}`;
        }

        // Scrape recent sold prices
        const marketData = await this.scrapeEbaySoldListings(searchQuery, 10);
        
        if (marketData.length > 0) {
          // Calculate median price
          const prices = marketData.map(d => d.price).sort((a, b) => a - b);
          const medianPrice = prices[Math.floor(prices.length / 2)];
          
          // Get the most recent price for current price
          const currentPrice = marketData[0].price;

          // Insert new price history records
          for (const data of marketData) {
            try {
              await db.insert(priceHistory).values({
                collectibleId: collectible.id,
                price: data.price.toString(),
                source: data.source,
                condition: data.condition,
                scrapedAt: data.soldDate || new Date()
              });
            } catch (insertError) {
              // Skip if duplicate entry
              continue;
            }
          }

          // Update median price
          await db.insert(medianPrices).values({
            collectibleId: collectible.id,
            medianPrice: medianPrice.toString(),
            date: new Date(),
            activeListings: marketData.length
          }).onConflictDoNothing();

          console.log(`Updated ${collectible.name}: Current $${currentPrice}, Median $${medianPrice} from ${marketData.length} sales`);
        }

        // Add delay to be respectful to the website
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Error updating prices for ${collectible.name}:`, error);
      }
    }

    console.log('Price update process completed');
  }

  // Get specific collectible pricing data
  async getCollectibleMarketData(collectibleId: string) {
    const collectible = await db.select().from(collectibles).where(eq(collectibles.id, collectibleId)).limit(1);
    
    if (!collectible.length) {
      throw new Error('Collectible not found');
    }

    // Get recent price history
    const recentPrices = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.collectibleId, collectibleId))
      .orderBy(desc(priceHistory.scrapedAt))
      .limit(50);

    // Get latest median price
    const latestMedian = await db
      .select()
      .from(medianPrices)
      .where(eq(medianPrices.collectibleId, collectibleId))
      .orderBy(desc(medianPrices.date))
      .limit(1);

    return {
      collectible: collectible[0],
      recentPrices,
      currentMedian: latestMedian[0]
    };
  }

  // Update prices for a specific collectible
  async updateSpecificCollectible(collectibleId: string) {
    const collectible = await db.select().from(collectibles).where(eq(collectibles.id, collectibleId)).limit(1);
    
    if (!collectible.length) {
      throw new Error('Collectible not found');
    }

    const item = collectible[0];
    let searchQuery = `${item.name}`;
    if (item.brand) searchQuery = `${item.brand} ${searchQuery}`;
    if (item.model) searchQuery += ` ${item.model}`;
    if (item.year) searchQuery += ` ${item.year}`;

    const marketData = await this.scrapeEbaySoldListings(searchQuery, 15);
    
    if (marketData.length > 0) {
      // Insert new price records
      for (const data of marketData) {
        try {
          await db.insert(priceHistory).values({
            collectibleId: item.id,
            price: data.price.toString(),
            source: data.source,
            condition: data.condition,
            scrapedAt: data.soldDate || new Date()
          });
        } catch {
          continue;
        }
      }

      // Calculate and update median
      const prices = marketData.map(d => d.price).sort((a, b) => a - b);
      const medianPrice = prices[Math.floor(prices.length / 2)];

      await db.insert(medianPrices).values({
        collectibleId: item.id,
        medianPrice: medianPrice.toString(),
        date: new Date(),
        activeListings: marketData.length
      }).onConflictDoNothing();

      return {
        success: true,
        currentPrice: marketData[0].price,
        medianPrice,
        activeListings: marketData.length
      };
    }

    return { success: false, message: 'No market data found' };
  }
}

export const marketplaceScraperService = new MarketplaceScraperService();
