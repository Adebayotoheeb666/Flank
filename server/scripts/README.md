# FUTA Locations Database Setup Guide

This directory contains scripts to populate the FUTA campus locations database with comprehensive building and navigation data.

## Overview

The seeding process loads **37 verified FUTA campus locations** into your Supabase database, including:
- Academic buildings (Schools, Faculties, Laboratories)
- Administrative facilities (Senate, Registrar, Student Affairs)
- Student facilities (Hostels, Residences, Student Center)
- Support services (Health Center, ATMs, Cafeterias)
- Sports and Recreation (Sports Center, Football Pitch, Tennis Courts)
- Landmarks and meeting points

## Files Included

1. **futa_locations_seed.json** - Complete location data (37 buildings)
2. **seed-locations.ts** - TypeScript seeding script
3. **seed-locations.sql** - SQL seeding script (direct Supabase execution)
4. **README.md** - This guide

## Prerequisites

### For TypeScript Script (`seed-locations.ts`)
- Node.js 16+ installed
- Environment variables configured:
  ```bash
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  ```

### For SQL Script (`seed-locations.sql`)
- Direct access to Supabase SQL Editor
- No additional setup needed

## Method 1: Using TypeScript Script (Recommended)

### Step 1: Set Environment Variables

Create or update `.env.local`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Find these values in your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy `Project URL` and `anon public key`

### Step 2: Run the Script

From the project root:

```bash
# Install dependencies if needed
pnpm install

# Run the seeding script
npx tsx server/scripts/seed-locations.ts
```

### Expected Output

```
🌱 Starting FUTA locations seed process...

📍 Found 37 locations to seed
🗑️  Clearing existing locations...

📤 Inserting locations into database...
✅ Successfully inserted 37 locations!

📊 Location Statistics:
------------------------
  admin: 5
  school: 9
  hostel: 5
  bank: 2
  food: 2
  health: 1
  venue: 8

  TOTAL: 37

✨ Seed completed successfully!
```

## Method 2: Using SQL Script (Direct)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Execute

1. Copy the entire contents of `seed-locations.sql`
2. Paste into the SQL Editor
3. Click **Run**

### Step 3: Verify

The script will output location counts by category:
```
 category | count
----------+-------
 admin    |     5
 bank     |     2
 food     |     2
 health   |     1
 hostel   |     5
 school   |     9
 venue    |     8
(7 rows)
```

## Location Data Structure

Each location includes:

```json
{
  "id": "loc_unique_id",
  "name": "Building Name",
  "type": "Building Type",
  "category": "school|admin|hostel|bank|food|health|venue",
  "description": "Building description",
  "coordinates": {
    "lat": 7.2620,
    "lng": 5.1820
  },
  "metadata": {
    "opening_hours": "8:00 AM - 5:00 PM",
    "contact": "+234-52-250409",
    "building_code": "ADMIN-001",
    "departments": ["Dept1", "Dept2"],
    "capacity": 500
  }
}
```

## Location Categories

| Category | Count | Examples |
|----------|-------|----------|
| **admin** | 5 | Senate, Registrar, Student Affairs |
| **school** | 9 | SEET, SAAT, Sciences, Engineering |
| **hostel** | 5 | Ikenga, Oduduwa, Oba Ajagunna, Residence Hall |
| **bank** | 2 | First Bank, ATM Plaza |
| **food** | 2 | Main Cafeteria, Food Court |
| **health** | 1 | University Health Center |
| **venue** | 8 | Sports Center, Auditorium, Chapels, etc |
| **TOTAL** | **37** | |

## Database Schema

The `locations` table structure:

```sql
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  verified BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Road Network Integration

The navigation graph (`server/data/road_network.json`) includes:

- **37 navigation nodes** (one for each building/landmark)
- **41 edges** connecting buildings with realistic:
  - Walking distances (meters)
  - Elevation gains (meters - for hill-aware routing)
  - Natural campus pathways

This enables the A* pathfinding algorithm to calculate optimal routes between any two locations.

## Testing the Database

### In the Browser

1. Start the app: `pnpm dev`
2. Go to [Map Page](/map)
3. Try these searches:
   - "Senate" → should find Senate Building
   - "Hostel" → should show 4 hostels
   - "Cafeteria" → should find food options
   - Click category filters to explore

### Verify with API

```bash
# Get all locations
curl http://localhost:8080/api/locations

# Search for specific location
curl "http://localhost:8080/api/search?q=library"

# Get locations by category
curl "http://localhost:8080/api/locations?category=school"
```

## Troubleshooting

### Script fails with "Missing SUPABASE_URL"

**Solution:** Add environment variables to `.env.local`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Database table doesn't exist

**Solution:** The SQL script creates the table automatically. If using TypeScript script, ensure the table exists first:

```sql
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  verified BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### "Duplicate key value violates unique constraint"

**Solution:** The seed scripts include logic to clear existing locations. If you see this error:

1. Open Supabase SQL Editor
2. Run: `DELETE FROM locations WHERE id LIKE 'loc_%';`
3. Re-run the seeding script

### Map not showing locations

**Solution:** 
1. Clear browser cache
2. Verify locations exist: `curl http://localhost:8080/api/locations`
3. Check console for errors (DevTools → Console)
4. Restart dev server: `pnpm dev`

## Next Steps

1. ✅ **Seed database** using one of the methods above
2. ✅ **Test navigation** in the app's map view
3. 🔄 **Add more locations** as needed (use same JSON format)
4. 🔄 **Customize routes** - edit `road_network.json` for shortcuts
5. 🔄 **Add building images** to metadata for UI enhancement

## Additional Resources

- **FUTA Coordinates Reference:** Campus center is ~7.27°N, 5.18°E
- **Elevation Data:** Most hillside buildings have 5-15m elevation gains between nodes
- **Walking Speed:** Assumes ~1.4 m/s (5 km/h) for campus paths
- **Distance Calculation:** Uses basic Euclidean distance with meter-per-degree conversion

## Support

If you encounter issues:

1. Check the Supabase dashboard logs
2. Verify environment variables are set correctly
3. Ensure Supabase service is running
4. Check browser console for client-side errors
5. Review the documentation in `DOCUMENTATION.md`

## Future Enhancements

- [ ] Add building images/photos
- [ ] Implement accessibility routes
- [ ] Add real-time crowding data
- [ ] Include WiFi availability points
- [ ] Add emergency assembly points
- [ ] Integrate campus events calendar
