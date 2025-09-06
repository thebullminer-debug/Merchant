import puppeteer from 'puppeteer';
import { collectibles } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

interface MarketplaceImage {
  url: string;
  source: string;
  itemTitle: string;
  price?: number;
}

export class ImageScraperService {
  private browser: puppeteer.Browser | null = null;

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

  async scrapeEbayImages(searchQuery: string, limit = 5): Promise<MarketplaceImage[]> {
    if (!this.browser) await this.init();
    
    const page = await this.browser!.newPage();
    const images: MarketplaceImage[] = [];

    try {
      // Search eBay for sold listings
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=0&LH_Sold=1&LH_Complete=1&_ipg=48`;
      
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Extract image data from listings
      const listings = await page.evaluate(() => {
        const items = document.querySelectorAll('.s-item');
        const results: any[] = [];

        items.forEach((item, index) => {
          if (index >= 10) return; // Limit results
          
          const imgElement = item.querySelector('img.s-item__image');
          const titleElement = item.querySelector('.s-item__title');
          const priceElement = item.querySelector('.s-item__price');
          
          if (imgElement && titleElement) {
            const imgSrc = imgElement.getAttribute('src');
            const title = titleElement.textContent?.trim() || '';
            const priceText = priceElement?.textContent?.trim() || '';
            
            // Extract price number
            const priceMatch = priceText.match(/\$[\d,]+\.?\d*/);
            const price = priceMatch ? parseFloat(priceMatch[0].replace(/[\$,]/g, '')) : undefined;
            
            if (imgSrc && !imgSrc.includes('placeholder')) {
              results.push({
                url: imgSrc,
                source: 'eBay',
                itemTitle: title,
                price: price
              });
            }
          }
        });

        return results;
      });

      images.push(...listings.slice(0, limit));
    } catch (error) {
      console.error('Error scraping eBay images:', error);
    } finally {
      await page.close();
    }

    return images;
  }

  async updateCollectibleImages() {
    console.log('Starting image update process...');
    
    // Get all collectibles that need better images
    const allCollectibles = await db.select().from(collectibles);

    for (const collectible of allCollectibles) {
      try {
        console.log(`Updating images for: ${collectible.name}`);
        
        // Create search query for this specific collectible
        let searchQuery = `${collectible.name}`;
        if (collectible.brand) searchQuery = `${collectible.brand} ${searchQuery}`;
        if (collectible.model) searchQuery += ` ${collectible.model}`;
        if (collectible.year) searchQuery += ` ${collectible.year}`;

        // Add specific terms based on category to get authentic images
        if (collectible.name.includes('Rolex')) {
          searchQuery += ' authentic watch';
        } else if (collectible.name.includes('Mickey Mantle')) {
          searchQuery += ' baseball card PSA';
        } else if (collectible.name.includes('Beatles') || collectible.name.includes('Abbey Road')) {
          searchQuery += ' vinyl record original pressing';
        } else if (collectible.name.includes('Charizard')) {
          searchQuery += ' Pokemon card PSA graded';
        }

        // Scrape images from eBay
        const images = await this.scrapeEbayImages(searchQuery, 3);
        
        if (images.length > 0) {
          // Pick the best image (first one from sold listings)
          const bestImage = images[0];
          
          // Update the collectible with the new image URL
          await db
            .update(collectibles)
            .set({ 
              imageUrl: bestImage.url,
              updatedAt: new Date()
            })
            .where(eq(collectibles.id, collectible.id));

          console.log(`Updated ${collectible.name} with image from ${bestImage.source}`);
        }

        // Add delay to be respectful to the website
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error updating images for ${collectible.name}:`, error);
      }
    }

    console.log('Image update process completed');
  }

  // Get authentic images for specific collectibles with known sources
  async getAuthenticCollectibleImages() {
    const authenticImages = {
      // Rolex Submariner - Official Rolex images
      'rolex-submariner': 'https://media.rolex.com/image/upload/q_auto:eco/f_auto/t_v7/c_limit,w_1920/v1/catalogue/2025/bezel-constant-size-with-shadow/m126610ln-0001.jpg',
      
      // Mickey Mantle 1952 Topps - From PSA grading services
      'mickey-mantle-1952': 'https://d1w8cc2yygc27j.cloudfront.net/1064619827773048354/5806074344765598159.jpg',
      
      // Beatles Abbey Road - Original UK pressing image
      'beatles-abbey-road': 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg',
      
      // Pokemon Charizard Base Set - PSA graded example
      'charizard-base-set': 'https://assets.pokemon.com/assets/cms2/img/cards/web/EVO/EVO_EN_11.png'
    };

    return authenticImages;
  }

  // Update specific collectibles with authentic images
  async updateWithAuthenticImages() {
    const authenticImages = await this.getAuthenticCollectibleImages();

    // Update Rolex Submariner
    await db
      .update(collectibles)
      .set({ 
        imageUrl: authenticImages['rolex-submariner'],
        updatedAt: new Date()
      })
      .where(eq(collectibles.name, 'Rolex Submariner Date'));

    // Update Mickey Mantle card
    await db
      .update(collectibles)
      .set({ 
        imageUrl: 'https://static.tcgplayer.com/product-images/mantle-1952-topps-baseball-card.jpg',
        updatedAt: new Date()
      })
      .where(eq(collectibles.name, 'Mickey Mantle 1952 Topps'));

    // Update Beatles Abbey Road
    await db
      .update(collectibles)
      .set({ 
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg',
        updatedAt: new Date()
      })
      .where(eq(collectibles.name, 'The Beatles - Abbey Road'));

    console.log('Updated collectibles with authentic images');
  }
}

export const imageScraperService = new ImageScraperService();