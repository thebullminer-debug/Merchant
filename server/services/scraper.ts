import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { storage } from '../storage';
import { InsertPriceHistory } from '@shared/schema';

interface ScrapedPrice {
  price: number;
  source: string;
  listingUrl: string;
  condition?: string;
  collectibleId: string;
}

export class CollectibleScraper {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeEbay(searchTerm: string, collectibleId: string): Promise<ScrapedPrice[]> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    const prices: ScrapedPrice[] = [];

    try {
      const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}&_sop=15&LH_Complete=1&LH_Sold=1`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      const content = await page.content();
      const $ = cheerio.load(content);

      $('.s-item').each((_, element) => {
        const title = $(element).find('.s-item__title').text();
        const priceText = $(element).find('.s-item__price').text();
        const link = $(element).find('.s-item__link').attr('href');
        const condition = $(element).find('.SECONDARY_INFO').text();

        const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch && link && title) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (price > 0) {
            prices.push({
              price,
              source: 'eBay',
              listingUrl: link,
              condition: condition || 'Unknown',
              collectibleId
            });
          }
        }
      });

    } catch (error) {
      console.error('Error scraping eBay:', error);
    } finally {
      await page.close();
    }

    return prices;
  }

  async scrapeWatchStation(searchTerm: string, collectibleId: string): Promise<ScrapedPrice[]> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    const prices: ScrapedPrice[] = [];

    try {
      // Example watch marketplace scraping
      const searchUrl = `https://www.watchstation.com/search?q=${encodeURIComponent(searchTerm)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      const content = await page.content();
      const $ = cheerio.load(content);

      $('.product-item').each((_, element) => {
        const title = $(element).find('.product-name').text();
        const priceText = $(element).find('.price').text();
        const link = $(element).find('a').attr('href');

        const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch && link && title) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (price > 0) {
            prices.push({
              price,
              source: 'WatchStation',
              listingUrl: link.startsWith('http') ? link : `https://www.watchstation.com${link}`,
              condition: 'New',
              collectibleId
            });
          }
        }
      });

    } catch (error) {
      console.error('Error scraping WatchStation:', error);
    } finally {
      await page.close();
    }

    return prices;
  }

  async scrapeTCGPlayer(searchTerm: string, collectibleId: string): Promise<ScrapedPrice[]> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    const prices: ScrapedPrice[] = [];

    try {
      // Trading cards marketplace scraping
      const searchUrl = `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(searchTerm)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      const content = await page.content();
      const $ = cheerio.load(content);

      $('.search-result').each((_, element) => {
        const title = $(element).find('.product-name').text();
        const priceText = $(element).find('.market-price').text();
        const link = $(element).find('a').attr('href');
        const condition = $(element).find('.condition').text();

        const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch && link && title) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (price > 0) {
            prices.push({
              price,
              source: 'TCGPlayer',
              listingUrl: link.startsWith('http') ? link : `https://www.tcgplayer.com${link}`,
              condition: condition || 'Near Mint',
              collectibleId
            });
          }
        }
      });

    } catch (error) {
      console.error('Error scraping TCGPlayer:', error);
    } finally {
      await page.close();
    }

    return prices;
  }

  async scrapeDiscogs(searchTerm: string, collectibleId: string): Promise<ScrapedPrice[]> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    const prices: ScrapedPrice[] = [];

    try {
      // Vinyl records marketplace scraping
      const searchUrl = `https://www.discogs.com/search/?q=${encodeURIComponent(searchTerm)}&type=all`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      const content = await page.content();
      const $ = cheerio.load(content);

      $('.search_result').each((_, element) => {
        const title = $(element).find('.search_result_title').text();
        const priceText = $(element).find('.price').text();
        const link = $(element).find('a').attr('href');
        const condition = $(element).find('.item_condition').text();

        const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch && link && title) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (price > 0) {
            prices.push({
              price,
              source: 'Discogs',
              listingUrl: link.startsWith('http') ? link : `https://www.discogs.com${link}`,
              condition: condition || 'Very Good Plus',
              collectibleId
            });
          }
        }
      });

    } catch (error) {
      console.error('Error scraping Discogs:', error);
    } finally {
      await page.close();
    }

    return prices;
  }

  async scrapeAllSources(searchTerm: string, collectibleId: string, category: string): Promise<void> {
    const allPrices: ScrapedPrice[] = [];

    try {
      // Scrape relevant sources based on category
      if (category === 'watches') {
        const ebayPrices = await this.scrapeEbay(searchTerm, collectibleId);
        const watchStationPrices = await this.scrapeWatchStation(searchTerm, collectibleId);
        allPrices.push(...ebayPrices, ...watchStationPrices);
      } else if (category === 'trading-cards') {
        const ebayPrices = await this.scrapeEbay(searchTerm, collectibleId);
        const tcgPrices = await this.scrapeTCGPlayer(searchTerm, collectibleId);
        allPrices.push(...ebayPrices, ...tcgPrices);
      } else if (category === 'vinyl') {
        const ebayPrices = await this.scrapeEbay(searchTerm, collectibleId);
        const discogsPrices = await this.scrapeDiscogs(searchTerm, collectibleId);
        allPrices.push(...ebayPrices, ...discogsPrices);
      } else {
        // Scrape eBay for all categories as fallback
        const ebayPrices = await this.scrapeEbay(searchTerm, collectibleId);
        allPrices.push(...ebayPrices);
      }

      // Store price data in database
      for (const priceData of allPrices) {
        const insertData: InsertPriceHistory = {
          collectibleId: priceData.collectibleId,
          source: priceData.source,
          price: priceData.price.toString(),
          listingUrl: priceData.listingUrl,
          condition: priceData.condition,
          isActive: 1
        };
        
        await storage.addPriceData(insertData);
      }

      console.log(`Scraped ${allPrices.length} prices for ${searchTerm}`);

    } catch (error) {
      console.error('Error in scrapeAllSources:', error);
    }
  }
}

export const scraper = new CollectibleScraper();
