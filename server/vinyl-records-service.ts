import { storage } from "./storage";

// Multi-source vinyl records service for fetching from various APIs
export class VinylRecordsService {
  private discogsToken: string | undefined;
  
  constructor() {
    this.discogsToken = process.env.DISCOGS_API_TOKEN;
  }

  // Fetch vinyl records from Discogs API
  async fetchFromDiscogs(query: string, limit: number = 10): Promise<any[]> {
    if (!this.discogsToken) {
      console.warn("Discogs API token not provided, skipping Discogs integration");
      return [];
    }

    try {
      const response = await fetch(`https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=vinyl&per_page=${limit}`, {
        headers: {
          'User-Agent': 'CollectiMarket/1.0',
          'Authorization': `Discogs token=${this.discogsToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Discogs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error fetching from Discogs:", error);
      return [];
    }
  }

  // Fetch vinyl records from MusicBrainz (free API)
  async fetchFromMusicBrainz(artist: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`https://musicbrainz.org/ws/2/release?query=artist:${encodeURIComponent(artist)} AND format:vinyl&fmt=json&limit=${limit}`, {
        headers: {
          'User-Agent': 'CollectiMarket/1.0 (contact@collectimarket.com)'
        }
      });

      if (!response.ok) {
        throw new Error(`MusicBrainz API error: ${response.status}`);
      }

      const data = await response.json();
      return data.releases || [];
    } catch (error) {
      console.error("Error fetching from MusicBrainz:", error);
      return [];
    }
  }

  // Convert Discogs data to our collectible format
  private convertDiscogsToCollectible(item: any, vinylCategoryId: string) {
    const yearMatch = item.year ? item.year : null;
    const imageUrl = item.thumb || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
    
    return {
      name: item.title || "Unknown Album",
      description: `${item.title} - Released ${item.year || "Unknown"}. ${item.label?.join(", ") || ""}`,
      categoryId: vinylCategoryId,
      brand: item.label?.[0] || "Unknown Label",
      model: item.catno || "Unknown",
      year: yearMatch,
      condition: "Various",
      imageUrl: imageUrl.startsWith('http') ? imageUrl : "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: [
        ...(item.genre || []),
        ...(item.style || []),
        "vinyl",
        "discogs"
      ].slice(0, 8), // Limit tags
      metadata: {
        artist: item.title?.split(" - ")[0] || "Unknown",
        label: item.label?.[0] || "Unknown",
        country: item.country || "Unknown",
        format: item.format?.join(", ") || "Vinyl",
        discogsId: item.id?.toString() || null
      }
    };
  }

  // Convert MusicBrainz data to our collectible format
  private convertMusicBrainzToCollectible(item: any, vinylCategoryId: string) {
    const year = item.date ? parseInt(item.date.split('-')[0]) : null;
    
    return {
      name: `${item["artist-credit"]?.[0]?.artist?.name || "Unknown Artist"} - ${item.title}`,
      description: `${item.title} by ${item["artist-credit"]?.[0]?.artist?.name || "Unknown Artist"}. ${item.disambiguation || ""}`,
      categoryId: vinylCategoryId,
      brand: item["label-info"]?.[0]?.label?.name || "Unknown Label",
      model: item.barcode || item.id || "Unknown",
      year: year,
      condition: "Various",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: [
        item["artist-credit"]?.[0]?.artist?.name?.toLowerCase().replace(/\s+/g, '-') || "unknown-artist",
        "vinyl",
        "musicbrainz",
        ...(item.country ? [item.country.toLowerCase()] : [])
      ].slice(0, 8),
      metadata: {
        artist: item["artist-credit"]?.[0]?.artist?.name || "Unknown Artist",
        label: item["label-info"]?.[0]?.label?.name || "Unknown Label",
        country: item.country || "Unknown",
        barcode: item.barcode || null,
        musicbrainzId: item.id || null
      }
    };
  }

  // Main function to add vinyl records from multiple sources
  async addVinylRecordsFromSources(): Promise<{ added: number; errors: string[] }> {
    const results = { added: 0, errors: [] as string[] };
    
    try {
      // Get vinyl records category
      const categories = await storage.getCategories();
      const vinylCategory = categories.find(cat => cat.slug === "vinyl-records");
      
      if (!vinylCategory) {
        results.errors.push("Vinyl Records category not found");
        return results;
      }

      // List of popular artists/albums to fetch
      const searchQueries = [
        "Pink Floyd",
        "The Beatles",
        "Led Zeppelin",
        "David Bowie",
        "Fleetwood Mac",
        "Queen",
        "The Rolling Stones",
        "Radiohead",
        "Nirvana",
        "Bob Dylan"
      ];

      // Fetch from Discogs
      for (const query of searchQueries.slice(0, 5)) { // Limit to avoid rate limits
        try {
          const discogsItems = await this.fetchFromDiscogs(query, 2);
          
          for (const item of discogsItems) {
            try {
              const collectible = this.convertDiscogsToCollectible(item, vinylCategory.id);
              await storage.createCollectible(collectible);
              results.added++;
              
              // Add some sample price data
              const basePrice = Math.floor(Math.random() * 200) + 20; // $20-220
              await storage.addPriceData({
                collectibleId: (await storage.getCollectibles())[results.added - 1]?.id || "temp",
                price: basePrice.toString(),
                source: "Discogs",
                condition: collectible.condition || "VG+",
                listingUrl: `https://discogs.com/release/${item.id}`
              });
              
            } catch (error) {
              results.errors.push(`Error adding Discogs item ${item.title}: ${error}`);
            }
          }
          
          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.errors.push(`Error fetching from Discogs for "${query}": ${error}`);
        }
      }

      // Fetch from MusicBrainz
      for (const artist of searchQueries.slice(0, 3)) { // Limit to avoid overwhelming
        try {
          const mbItems = await this.fetchFromMusicBrainz(artist, 2);
          
          for (const item of mbItems) {
            try {
              const collectible = this.convertMusicBrainzToCollectible(item, vinylCategory.id);
              await storage.createCollectible(collectible);
              results.added++;
              
              // Add some sample price data
              const basePrice = Math.floor(Math.random() * 150) + 15; // $15-165
              await storage.addPriceData({
                collectibleId: (await storage.getCollectibles())[results.added - 1]?.id || "temp",
                price: basePrice.toString(),
                source: "MusicBrainz",
                condition: collectible.condition || "VG",
                listingUrl: `https://musicbrainz.org/release/${item.id}`
              });
              
            } catch (error) {
              results.errors.push(`Error adding MusicBrainz item ${item.title}: ${error}`);
            }
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.errors.push(`Error fetching from MusicBrainz for "${artist}": ${error}`);
        }
      }

      console.log(`✅ Added ${results.added} vinyl records from multiple sources`);
      if (results.errors.length > 0) {
        console.log(`⚠️  Encountered ${results.errors.length} errors`);
      }

    } catch (error) {
      results.errors.push(`General error: ${error}`);
    }

    return results;
  }
}

export const vinylRecordsService = new VinylRecordsService();