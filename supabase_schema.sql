-- FUTA Pathfinder Location Table Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  coordinates JSONB NOT NULL, -- {lat: number, lng: number, x?: number, y?: number}
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for searching the map)
CREATE POLICY "Allow public read access" ON locations
FOR SELECT USING (true);

-- Allow authenticated users to insert/update (admins)
CREATE POLICY "Allow authenticated insert access" ON locations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access" ON locations
FOR UPDATE USING (auth.role() = 'authenticated');

-- Seed initial data (Optional)
-- INSERT INTO locations (name, type, category, description, coordinates)
-- VALUES 
-- ('SEET Complex', 'School', 'school', 'School of Engineering and Engineering Technology', '{"lat": 7.3000, "lng": 5.1300, "x": 45, "y": 30}'),
-- ('Senate Building', 'Admin', 'admin', 'Administrative headquarters of FUTA', '{"lat": 7.3010, "lng": 5.1310, "x": 50, "y": 50}'),
-- ('Albert Ilemobade Library', 'Facility', 'study', 'Central university library', '{"lat": 7.3020, "lng": 5.1320, "x": 55, "y": 45}'),
-- ('Abiola Food Court', 'Dining', 'food', 'Popular student cafeteria', '{"lat": 7.2990, "lng": 5.1290, "x": 40, "y": 60}'),
-- ('Health Centre', 'Medical', 'health', '24/7 medical services for students and staff', '{"lat": 7.2980, "lng": 5.1280, "x": 30, "y": 40}'),
-- ('SAAT Building', 'School', 'school', 'School of Agriculture and Agricultural Technology', '{"lat": 7.3030, "lng": 5.1330, "x": 60, "y": 35}'),
-- ('GTBank ATM', 'Bank', 'bank', 'Bank and ATM gallery', '{"lat": 7.3015, "lng": 5.1325, "x": 52, "y": 55}'),
-- ('The Big Mango Tree', 'Landmark', 'landmark', 'Famous campus meeting point', '{"lat": 7.3005, "lng": 5.1305, "x": 48, "y": 48}');
