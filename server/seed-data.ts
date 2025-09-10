import { storage } from "./storage";
import type { InsertCategory, InsertCollectible, InsertPriceHistory, InsertMedianPrice } from "@shared/schema";

// Comprehensive category data with realistic market coverage
const categoriesData: InsertCategory[] = [
  {
    name: "Watches",
    slug: "watches",
    icon: "⌚",
    description: "Luxury watches, vintage timepieces, and collectible chronometers"
  },
  {
    name: "Trading Cards",
    slug: "trading-cards",
    icon: "🎴",
    description: "Sports cards, Pokémon, Magic: The Gathering, and rare gaming cards"
  },
  {
    name: "Vinyl Records",
    slug: "vinyl-records",
    icon: "💿",
    description: "Vintage vinyl records, rare pressings, and collectible albums"
  },
  {
    name: "Coins",
    slug: "coins",
    icon: "🪙",
    description: "Rare coins, currency, and numismatic collectibles"
  },
  {
    name: "Sports Collectibles",
    slug: "sports-collectibles", 
    icon: "🏆",
    description: "Sports memorabilia, autographed items, and game-used equipment"
  },
  {
    name: "Collector Cars",
    slug: "collector-cars",
    icon: "🚗",
    description: "Classic cars, vintage automobiles, and rare automotive collectibles"
  },
  {
    name: "Military",
    slug: "military",
    icon: "🎖️",
    description: "Military memorabilia, medals, weapons, and historical artifacts"
  },
  {
    name: "Art",
    slug: "art",
    icon: "🎨",
    description: "Fine art, sculptures, paintings, and contemporary collectible artwork"
  }
];

// Authentic collectible items with realistic market data
const collectiblesData: InsertCollectible[] = [
  // Luxury Watches
  {
    id: "30ede095-8a47-43d4-9178-88509239a07a",
    name: "Rolex Submariner Date",
    description: "Iconic diving watch with date display and unidirectional bezel. Reference 126610LN in stainless steel with black dial and ceramic bezel.",
    categoryId: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
    brand: "Rolex",
    model: "Submariner Date 126610LN",
    year: 2020,
    condition: "Excellent",
    imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["luxury", "diving", "steel", "automatic"],
    metadata: {
      caseDiameter: "41mm",
      movement: "Caliber 3235",
      waterResistance: "300m",
      bracelet: "Oyster"
    }
  },
  {
    id: "dcbce0d4-1ffb-4dd0-8d32-20cd81095adf",
    name: "Patek Philippe Nautilus",
    description: "The legendary sports luxury watch designed by Gérald Genta. Reference 5711/1A-010 in stainless steel with blue horizontal embossed dial.",
    categoryId: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
    brand: "Patek Philippe",
    model: "Nautilus 5711/1A-010",
    year: 2019,
    condition: "New",
    imageUrl: "https://images.unsplash.com/photo-1594576662830-a558fae5b143?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["luxury", "discontinued", "steel", "automatic"],
    metadata: {
      caseDiameter: "40mm",
      movement: "Caliber 324 S C",
      waterResistance: "120m",
      bracelet: "Integrated"
    }
  },
  {
    id: "a1b2c3d4-5678-9abc-def0-123456789abc",
    name: "Audemars Piguet Royal Oak",
    description: "Iconic octagonal luxury sports watch. Reference 15202ST.OO.1240ST.01 in stainless steel with blue dial.",
    categoryId: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
    brand: "Audemars Piguet",
    model: "Royal Oak 15202ST",
    year: 2021,
    condition: "Excellent",
    imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["luxury", "octagonal", "steel", "thin"],
    metadata: {
      caseDiameter: "39mm",
      movement: "Caliber 2121",
      thickness: "8.1mm",
      bracelet: "Integrated"
    }
  },

  // Trading Cards - Sports
  {
    id: "sport-card-001",
    name: "2003 LeBron James Rookie Card",
    description: "Upper Deck Exquisite Collection LeBron James Rookie Patch Autograph #78/99. BGS 9.5 Gem Mint with 10 Autograph.",
    categoryId: "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
    brand: "Upper Deck",
    model: "Exquisite Collection",
    year: 2003,
    condition: "BGS 9.5",
    imageUrl: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["rookie", "autographed", "patch", "graded"],
    metadata: {
      player: "LeBron James",
      cardNumber: "78/99",
      grader: "BGS",
      grade: "9.5"
    }
  },
  {
    id: "sport-card-002", 
    name: "1952 Mickey Mantle Topps #311",
    description: "The holy grail of baseball cards. PSA 8 NM-MT condition. One of the most iconic and valuable cards ever produced.",
    categoryId: "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
    brand: "Topps",
    model: "1952 Baseball",
    year: 1952,
    condition: "PSA 8",
    imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["vintage", "baseball", "hall-of-fame", "graded"],
    metadata: {
      player: "Mickey Mantle",
      cardNumber: "#311",
      grader: "PSA",
      grade: "8"
    }
  },

  // Trading Cards - Pokemon
  {
    id: "pokemon-card-001",
    name: "1998 Pikachu Illustrator",
    description: "The rarest Pokémon card ever made. Given to winners of a 1997 illustration contest in Japan. PSA 10 Gem Mint.",
    categoryId: "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
    brand: "Pokémon",
    model: "Promo",
    year: 1998,
    condition: "PSA 10",
    imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["pokemon", "promo", "japanese", "graded"],
    metadata: {
      pokemon: "Pikachu",
      rarity: "Promo",
      language: "Japanese",
      population: "Very Low"
    }
  },

  // Vinyl Records
  {
    id: "vinyl-001",
    name: "The Beatles - Abbey Road",
    description: "Original UK pressing from 1969. Apple Records PCS 7088. Near Mint condition with original inner sleeve.",
    categoryId: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
    brand: "Apple Records",
    model: "PCS 7088",
    year: 1969,
    condition: "Near Mint",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["beatles", "original-pressing", "uk", "stereo"],
    metadata: {
      artist: "The Beatles",
      label: "Apple Records",
      pressing: "UK Original",
      matrix: "YEX 749-2"
    }
  },
  {
    id: "vinyl-002",
    name: "Led Zeppelin IV",
    description: "Original UK pressing Atlantic 2401012. Features the rare misprint 'Led Zepplin' on some labels. VG+ condition.",
    categoryId: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
    brand: "Atlantic",
    model: "2401012",
    year: 1971,
    condition: "VG+",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["led-zeppelin", "original-pressing", "uk", "classic-rock"],
    metadata: {
      artist: "Led Zeppelin",
      label: "Atlantic",
      pressing: "UK Original",
      notes: "Misprint label variant"
    }
  },

  // Coins
  {
    id: "coin-001",
    name: "1933 Double Eagle",
    description: "The most valuable gold coin in the world. One of only a few known to exist legally. PCGS MS65.",
    categoryId: "6ba7b815-9dad-11d1-80b4-00c04fd430c8",
    brand: "US Mint",
    model: "Saint-Gaudens Double Eagle",
    year: 1933,
    condition: "PCGS MS65",
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["gold", "rare", "american", "graded"],
    metadata: {
      denomination: "$20",
      composition: "Gold",
      weight: "33.431g",
      mintage: "445,500"
    }
  },

  // Collector Cars
  {
    id: "car-001",
    name: "1955 Mercedes-Benz 300SL Gullwing",
    description: "Iconic gullwing doors and racing heritage. Silver metallic with red leather interior. Matching numbers and comprehensive restoration.",
    categoryId: "6ba7b817-9dad-11d1-80b4-00c04fd430c8",
    brand: "Mercedes-Benz",
    model: "300SL Gullwing",
    year: 1955,
    condition: "Concours Restored",
    imageUrl: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["gullwing", "classic", "racing-heritage", "restored"],
    metadata: {
      engine: "3.0L Inline-6",
      transmission: "4-Speed Manual",
      mileage: "45,000",
      color: "Silver Metallic"
    }
  }
];

// Realistic price history data
async function generatePriceHistory() {
  const priceHistoryData: InsertPriceHistory[] = [];
  const medianPriceData: InsertMedianPrice[] = [];

  // Price data for luxury watches
  const watchPrices = {
    "30ede095-8a47-43d4-9178-88509239a07a": { base: 12800, volatility: 0.15 }, // Rolex Sub
    "dcbce0d4-1ffb-4dd0-8d32-20cd81095adf": { base: 185000, volatility: 0.25 }, // Patek Nautilus
    "a1b2c3d4-5678-9abc-def0-123456789abc": { base: 95000, volatility: 0.20 }   // AP Royal Oak
  };

  // Price data for trading cards
  const cardPrices = {
    "sport-card-001": { base: 125000, volatility: 0.30 }, // LeBron rookie
    "sport-card-002": { base: 425000, volatility: 0.35 }, // Mickey Mantle
    "pokemon-card-001": { base: 6350000, volatility: 0.40 } // Pikachu Illustrator
  };

  // Price data for other collectibles
  const otherPrices = {
    "vinyl-001": { base: 850, volatility: 0.25 },
    "vinyl-002": { base: 450, volatility: 0.20 },
    "coin-001": { base: 18900000, volatility: 0.15 },
    "car-001": { base: 1850000, volatility: 0.18 }
  };

  const allPrices = { ...watchPrices, ...cardPrices, ...otherPrices };

  // Generate 90 days of price history
  for (const [collectibleId, priceData] of Object.entries(allPrices)) {
    let currentPrice = priceData.base;
    
    for (let day = 90; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      // Generate realistic price movement
      const dailyChange = (Math.random() - 0.5) * priceData.volatility * 0.1;
      currentPrice *= (1 + dailyChange);
      
      // Add some listing data
      const listingCount = Math.floor(Math.random() * 10) + 1;
      
      for (let i = 0; i < listingCount; i++) {
        const variance = (Math.random() - 0.5) * 0.1;
        const listingPrice = currentPrice * (1 + variance);
        
        priceHistoryData.push({
          collectibleId,
          price: Number(listingPrice.toFixed(2)),
          marketplace: Math.random() > 0.5 ? "eBay" : "Heritage Auctions",
          date,
          condition: "Excellent",
          listingType: Math.random() > 0.7 ? "auction" : "buy-it-now"
        });
      }
      
      // Add median price for the day
      if (day <= 30) { // Only last 30 days for median prices
        const dayChange = day === 0 ? 0 : ((currentPrice - priceData.base) / priceData.base) * 100;
        
        medianPriceData.push({
          collectibleId,
          medianPrice: Number(currentPrice.toFixed(2)),
          dayChange: Number(dayChange.toFixed(2)),
          weekChange: Number((dayChange * 1.2).toFixed(2)),
          monthChange: Number((dayChange * 1.5).toFixed(2)),
          activeListings: Math.floor(Math.random() * 25) + 5,
          date
        });
      }
    }
  }

  return { priceHistoryData, medianPriceData };
}

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Seed categories
    console.log("📂 Seeding categories...");
    for (const category of categoriesData) {
      try {
        await storage.createCategory(category);
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        console.log(`⚠️  Category ${category.name} already exists`);
      }
    }
    
    // Seed collectibles
    console.log("🎯 Seeding collectibles...");
    for (const collectible of collectiblesData) {
      try {
        await storage.createCollectible(collectible);
        console.log(`✅ Created collectible: ${collectible.name}`);
      } catch (error) {
        console.log(`⚠️  Collectible ${collectible.name} already exists`);
      }
    }
    
    // Generate and seed price data
    console.log("💰 Generating price history...");
    const { priceHistoryData, medianPriceData } = await generatePriceHistory();
    
    console.log("📈 Seeding price history...");
    for (const pricePoint of priceHistoryData) {
      try {
        await storage.addPriceData(pricePoint);
      } catch (error) {
        // Skip duplicates
      }
    }
    
    console.log("📊 Seeding median prices...");
    for (const medianPrice of medianPriceData) {
      try {
        await storage.addMedianPrice(medianPrice);
      } catch (error) {
        // Skip duplicates
      }
    }
    
    console.log("🎉 Database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}