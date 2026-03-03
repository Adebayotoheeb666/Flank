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

-- ============================================================================
-- Phase 3: Student Timetable Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  venue TEXT NOT NULL,
  time TEXT NOT NULL,
  day TEXT NOT NULL,
  duration INTEGER NOT NULL,
  notification_time INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (simple student ID based - no auth required for MVP)
CREATE POLICY "Allow public read access" ON student_courses
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON student_courses
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON student_courses
FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON student_courses
FOR DELETE USING (true);

-- ============================================================================
-- Phase 3: Emergency SOS Alerts Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_id TEXT NOT NULL UNIQUE,
  sos_type TEXT NOT NULL CHECK (sos_type IN ('medical', 'fire', 'security')),
  user_id TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  responders_notified TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_location_update TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (simple user ID based - no auth required for MVP)
CREATE POLICY "Allow public read access" ON sos_alerts
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON sos_alerts
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON sos_alerts
FOR UPDATE USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS sos_alerts_sos_id_idx ON sos_alerts(sos_id);
CREATE INDEX IF NOT EXISTS sos_alerts_user_id_idx ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS sos_alerts_status_idx ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS student_courses_student_id_idx ON student_courses(student_id);
