import { storage } from "./storage";

// Simple seeding with just a few key categories and items
export async function quickSeed() {
  try {
    console.log("🌱 Quick seeding database...");
    
    // Create core categories
    const categories = [
      { name: "Watches", slug: "watches", icon: "⌚", description: "Luxury watches and timepieces" },
      { name: "Trading Cards", slug: "trading-cards", icon: "🎴", description: "Sports and gaming cards" },
      { name: "Vinyl Records", slug: "vinyl-records", icon: "💿", description: "Collectible vinyl records" },
      { name: "Collector Cars", slug: "collector-cars", icon: "🚗", description: "Classic and vintage cars" }
    ];

    for (const cat of categories) {
      try {
        await storage.createCategory(cat);
        console.log(`✅ Created category: ${cat.name}`);
      } catch (error) {
        console.log(`⚠️ Category ${cat.name} exists`);
      }
    }

    // Get categories to get their IDs
    const allCategories = await storage.getCategories();
    const watchCat = allCategories.find(c => c.slug === "watches");
    const cardCat = allCategories.find(c => c.slug === "trading-cards");

    if (watchCat && cardCat) {
      // Create some collectibles
      const collectibles = [
        {
          name: "Rolex Submariner Date",
          description: "Iconic diving watch in excellent condition",
          categoryId: watchCat.id,
          brand: "Rolex",
          model: "126610LN",
          year: 2020,
          condition: "Excellent",
          imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          tags: ["luxury", "diving", "automatic"],
          metadata: { caseDiameter: "41mm", movement: "3235" }
        },
        {
          name: "2003 LeBron James Rookie Card",
          description: "Upper Deck Exquisite Collection rookie card",
          categoryId: cardCat.id,
          brand: "Upper Deck",
          model: "Exquisite Collection",
          year: 2003,
          condition: "BGS 9.5",
          imageUrl: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          tags: ["rookie", "basketball", "graded"],
          metadata: { player: "LeBron James", grade: "9.5" }
        }
      ];

      for (const item of collectibles) {
        try {
          const created = await storage.createCollectible(item);
          console.log(`✅ Created collectible: ${item.name}`);
          
          // Add some price data
          const today = new Date();
          const price = item.name.includes("Rolex") ? 12800 : 125000;
          
          await storage.addPriceData({
            collectibleId: created.id,
            price: price,
            marketplace: "eBay",
            date: today,
            condition: item.condition || "Excellent",
            listingType: "buy-it-now"
          });

          await storage.addMedianPrice({
            collectibleId: created.id,
            medianPrice: price,
            dayChange: Math.random() * 10 - 5,
            weekChange: Math.random() * 20 - 10,
            monthChange: Math.random() * 30 - 15,
            activeListings: Math.floor(Math.random() * 20) + 5,
            date: today
          });

        } catch (error) {
          console.log(`⚠️ Collectible ${item.name} exists or error:`, error);
        }
      }
    }

    console.log("🎉 Quick seeding completed!");
    return true;
    
  } catch (error) {
    console.error("❌ Quick seed error:", error);
    return false;
  }
}