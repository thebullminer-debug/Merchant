import { vinylRecordsService } from "./vinyl-records-service";

// Simple function to add vinyl records from multiple sources
export async function addVinylRecords() {
  console.log("🎵 Starting vinyl records import from multiple sources...");
  
  try {
    const results = await vinylRecordsService.addVinylRecordsFromSources();
    
    console.log(`🎉 Vinyl import completed!`);
    console.log(`📀 Added: ${results.added} new vinyl records`);
    
    if (results.errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${results.errors.length}`);
      results.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    return true;
  } catch (error) {
    console.error("❌ Vinyl import failed:", error);
    return false;
  }
}