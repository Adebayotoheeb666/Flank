/**
 * Script to seed FUTA locations into Supabase
 * Run with: npx tsx server/scripts/seed-locations.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs/promises";
import * as path from "path";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Location {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  metadata?: Record<string, any>;
}

interface SeedData {
  locations: Location[];
}

async function seedLocations() {
  try {
    console.log("🌱 Starting FUTA locations seed process...\n");

    // Read seed data
    const seedDataPath = path.join(process.cwd(), "server/data/futa_locations_seed.json");
    const seedDataContent = await fs.readFile(seedDataPath, "utf-8");
    const seedData: SeedData = JSON.parse(seedDataContent);

    console.log(`📍 Found ${seedData.locations.length} locations to seed`);

    // Clear existing locations (optional - comment out if you want to keep existing)
    console.log("🗑️  Clearing existing locations...");
    const { error: deleteError } = await supabase.from("locations").delete().neq("id", "");
    if (deleteError) {
      console.warn("⚠️  Could not clear existing locations:", deleteError);
    }

    // Insert locations
    const locationsToInsert = seedData.locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      category: loc.category,
      description: loc.description,
      latitude: loc.coordinates.lat,
      longitude: loc.coordinates.lng,
      verified: true,
      metadata: loc.metadata || {},
    }));

    console.log("\n📤 Inserting locations into database...");

    const { data, error } = await supabase
      .from("locations")
      .insert(locationsToInsert)
      .select();

    if (error) {
      console.error("❌ Error inserting locations:", error);
      process.exit(1);
    }

    console.log(`✅ Successfully inserted ${data?.length || 0} locations!\n`);

    // Print statistics
    const categories = seedData.locations.reduce(
      (acc, loc) => {
        acc[loc.category] = (acc[loc.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("📊 Location Statistics:");
    console.log("------------------------");
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat.toUpperCase()}: ${count}`);
    });
    console.log(`\n  TOTAL: ${seedData.locations.length}`);
    console.log("\n✨ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedLocations();
