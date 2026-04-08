# Quick Start: Seed FUTA Campus Locations Database

This guide will help you populate your Supabase database with 37 FUTA campus locations in under 5 minutes.

## 🚀 Quick Start (2 Steps)

### Step 1: Set Environment Variables

Add to your `.env.local` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**How to find these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **API**
4. Copy "Project URL" and "anon public" key

### Step 2: Run the Seed Script

```bash
npx tsx server/scripts/seed-locations.ts
```

**Done!** ✅ Your database is now populated with:
- 37 campus locations
- 9 academic buildings
- 5 hostels
- Multiple support services
- Sports facilities
- Navigation coordinates

---

## 📍 What Gets Seeded?

| Category | Count | Examples |
|----------|-------|----------|
| 🏫 **Schools** | 9 | SEET, SAAT, Sciences, Engineering |
| 🏛️ **Admin** | 5 | Senate, Registrar, Student Affairs |
| 🏢 **Hostels** | 5 | Ikenga, Oduduwa, Residence Halls |
| 🏪 **Banks** | 2 | First Bank, ATM Plaza |
| 🍽️ **Food** | 2 | Main Cafeteria, Food Court |
| 🏥 **Health** | 1 | University Health Center |
| 🎭 **Venues** | 8 | Sports Center, Auditorium, Sports |

---

## ⚠️ Alternative Method (If TypeScript Fails)

### Use Direct SQL in Supabase

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy-paste contents of `server/scripts/seed-locations.sql`
4. Click **Run**

---

## ✅ Verify It Worked

### In the Browser
1. Start the app: `pnpm dev`
2. Go to the [Map Page](/map)
3. Search for "Senate" - you should see results
4. Try clicking different category filters

### Via API
```bash
curl http://localhost:8080/api/locations
```

Should return 37 locations in JSON format.

---

## 🗑️ Reset/Reseed Database

If you need to start over:

```sql
DELETE FROM locations WHERE id LIKE 'loc_%';
```

Then run the seed script again.

---

## 📚 More Information

For detailed setup instructions and troubleshooting, see:
- **[Seeding Guide](server/scripts/README.md)** - Detailed instructions
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Complete project documentation

---

## 🎯 Next Steps

After seeding, you can:

1. **Search locations** on the map
2. **Get directions** between buildings
3. **Explore categories** (Schools, Hostels, Food, etc.)
4. **Add more locations** by editing the seed data
5. **Customize routes** in the road network

---

**Need help?** Check the troubleshooting section in [server/scripts/README.md](server/scripts/README.md)
