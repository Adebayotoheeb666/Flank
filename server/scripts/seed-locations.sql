-- FUTA Locations Database Seed Script
-- Run this in Supabase SQL Editor to populate the locations table
-- This will INSERT all FUTA campus locations with coordinates and metadata

-- Ensure the locations table exists
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);

-- Clear existing locations (optional - comment out if you want to keep existing)
DELETE FROM locations WHERE id LIKE 'loc_%';

-- Insert FUTA Locations
INSERT INTO locations (id, name, type, category, description, latitude, longitude, verified, metadata) VALUES
('loc_main_gate', 'Main Gate', 'Landmark', 'admin', 'Main entrance to FUTA campus', 7.2620, 5.1820, true, '{"opening_hours": "24/7", "contact": "+234-52-250409", "building_code": "GATE-001"}'),
('loc_senate_building', 'Senate Building', 'Administrative Building', 'admin', 'University Senate and administrative offices', 7.2680, 5.1850, true, '{"opening_hours": "8:00 AM - 5:00 PM", "contact": "+234-52-250500", "building_code": "ADMIN-001"}'),
('loc_main_library', 'Oladipo Akinola Main Library', 'Library', 'school', 'University main library with reading halls and research facilities', 7.2750, 5.1880, true, '{"opening_hours": "7:30 AM - 9:00 PM", "contact": "+234-52-250456", "building_code": "LIB-001", "floors": 4, "reading_spaces": 800}'),
('loc_seet_complex', 'SEET Complex', 'School Building', 'school', 'School of Electrical and Engineering Technology', 7.2700, 5.1900, true, '{"opening_hours": "8:00 AM - 6:00 PM", "contact": "+234-52-250650", "building_code": "SEET-001", "departments": ["Electrical Engineering", "Electronics and Electrical Engineering"]}'),
('loc_saat_building', 'SAAT Building', 'School Building', 'school', 'School of Agriculture and Agricultural Technology', 7.2660, 5.1920, true, '{"opening_hours": "8:00 AM - 6:00 PM", "contact": "+234-52-250720", "building_code": "SAAT-001", "departments": ["Agricultural Engineering", "Food Science", "Soil Science"]}'),
('loc_sciences_complex', 'School of Sciences Complex', 'School Building', 'school', 'Multiple departments - Physics, Chemistry, Biology, Mathematics', 7.2800, 5.1850, true, '{"opening_hours": "8:00 AM - 6:00 PM", "contact": "+234-52-250780", "building_code": "SCI-001", "departments": ["Physics", "Chemistry", "Biology", "Mathematics", "Microbiology"]}'),
('loc_admin_block_a', 'Administrative Block A', 'Administrative Building', 'admin', 'Registrar''s office, admissions, and student affairs', 7.2700, 5.1820, true, '{"opening_hours": "8:00 AM - 4:30 PM", "contact": "+234-52-250409", "building_code": "ADMIN-A"}'),
('loc_student_center', 'Student Center', 'Student Facility', 'venue', 'Student center with conference halls and meeting rooms', 7.2720, 5.1900, true, '{"opening_hours": "7:00 AM - 10:00 PM", "contact": "+234-52-250567", "building_code": "SC-001", "capacity": 500}'),
('loc_health_center', 'University Health Center', 'Medical Facility', 'health', 'Medical clinic and emergency services', 7.2750, 5.1950, true, '{"opening_hours": "24/7", "contact": "+234-52-250890", "building_code": "HC-001", "departments": ["General Medicine", "Emergency", "Pharmacy"]}'),
('loc_main_cafeteria', 'Main Cafeteria', 'Dining Facility', 'food', 'University main cafeteria with multiple food vendors', 7.2850, 5.1880, true, '{"opening_hours": "7:00 AM - 9:00 PM", "contact": "+234-52-250234", "building_code": "CAF-001", "seating_capacity": 2000}'),
('loc_food_court', 'Food Court', 'Dining Facility', 'food', 'Casual dining area with multiple food stalls', 7.2780, 5.1920, true, '{"opening_hours": "8:00 AM - 8:00 PM", "contact": "+234-52-250345", "building_code": "FC-001", "vendors": 15}'),
('loc_hostel_a', 'Hostel A (Ikenga)', 'Student Hostel', 'hostel', 'Male students hostel - 400 capacity', 7.2900, 5.1750, true, '{"opening_hours": "24/7", "contact": "+234-52-250456", "building_code": "HOSTEL-A", "capacity": 400, "gender": "Male"}'),
('loc_hostel_b', 'Hostel B (Oduduwa)', 'Student Hostel', 'hostel', 'Female students hostel - 300 capacity', 7.2920, 5.1800, true, '{"opening_hours": "24/7", "contact": "+234-52-250567", "building_code": "HOSTEL-B", "capacity": 300, "gender": "Female"}'),
('loc_hostel_c', 'Hostel C (Oba Ajagunna)', 'Student Hostel', 'hostel', 'Mixed students hostel - 250 capacity', 7.2880, 5.1850, true, '{"opening_hours": "24/7", "contact": "+234-52-250678", "building_code": "HOSTEL-C", "capacity": 250, "gender": "Mixed"}'),
('loc_bank_futa', 'First Bank (FUTA Branch)', 'Banking Service', 'bank', 'First Bank branch on campus', 7.2750, 5.1820, true, '{"opening_hours": "9:00 AM - 3:00 PM", "contact": "+234-52-250789", "building_code": "BANK-FB", "atm": true}'),
('loc_atm_plaza', 'ATM Plaza', 'Banking Service', 'bank', 'ATM machines - 24/7 access', 7.2700, 5.1950, true, '{"opening_hours": "24/7", "contact": "N/A", "building_code": "ATM-001", "machines": 8}'),
('loc_conference_center', 'Conference Center', 'Conference Hall', 'venue', 'Multi-purpose conference hall for events and seminars', 7.2650, 5.1900, true, '{"opening_hours": "8:00 AM - 8:00 PM", "contact": "+234-52-250999", "building_code": "CONF-001", "capacity": 1500}'),
('loc_sports_center', 'Sports Center', 'Sports Facility', 'venue', 'Multi-purpose sports arena and gym facilities', 7.2950, 5.1900, true, '{"opening_hours": "6:00 AM - 10:00 PM", "contact": "+234-52-250888", "building_code": "SPORT-001", "facilities": ["Basketball Court", "Volleyball Court", "Gym", "Swimming Pool"]}'),
('loc_ict_center', 'ICT Center', 'Computer Lab', 'school', 'Information and Communication Technology center with computer labs', 7.2820, 5.1910, true, '{"opening_hours": "7:00 AM - 9:00 PM", "contact": "+234-52-250555", "building_code": "ICT-001", "computer_stations": 150}'),
('loc_engineering_workshop', 'Engineering Workshop', 'Workshop', 'school', 'Engineering and technical workshop facilities', 7.2730, 5.1850, true, '{"opening_hours": "7:00 AM - 6:00 PM", "contact": "+234-52-250666", "building_code": "EWS-001"}'),
('loc_auditorium', 'Auditorium', 'Auditorium', 'venue', 'University auditorium for lectures and events', 7.2670, 5.1850, true, '{"opening_hours": "8:00 AM - 8:00 PM", "contact": "+234-52-250777", "building_code": "AUD-001", "capacity": 800}'),
('loc_graduation_pavilion', 'Graduation Pavilion', 'Event Venue', 'venue', 'Outdoor pavilion for ceremonies and events', 7.2900, 5.1950, true, '{"opening_hours": "Variable", "contact": "+234-52-250888", "building_code": "PAV-001", "capacity": 3000}'),
('loc_bookstore', 'University Bookstore', 'Retail', 'venue', 'Books, stationery, and academic materials', 7.2710, 5.1830, true, '{"opening_hours": "8:00 AM - 6:00 PM", "contact": "+234-52-250444", "building_code": "BOOK-001"}'),
('loc_security_post_main', 'Security Post (Main)', 'Security', 'admin', 'Campus security headquarters', 7.2625, 5.1825, true, '{"opening_hours": "24/7", "contact": "+234-52-250777 (Emergency)", "building_code": "SEC-001"}'),
('loc_big_mango_tree', 'Big Mango Tree Junction', 'Landmark', 'venue', 'Famous landmark - good meeting point', 7.2800, 5.1920, true, '{"opening_hours": "24/7", "contact": "N/A", "building_code": "LANDMARK-001"}'),
('loc_faculty_arts', 'Faculty of Arts Building', 'School Building', 'school', 'Faculty of Arts - English, History, Languages departments', 7.2850, 5.1750, true, '{"opening_hours": "8:00 AM - 6:00 PM", "contact": "+234-52-250111", "building_code": "ARTS-001", "departments": ["English", "History", "Modern Languages"]}'),
('loc_engineering_building', 'Faculty of Engineering Building', 'School Building', 'school', 'Faculty of Engineering - Civil, Mechanical, Chemical Engineering', 7.2680, 5.1920, true, '{"opening_hours": "8:00 AM - 6:00 PM", "contact": "+234-52-250222", "building_code": "ENG-001", "departments": ["Civil Engineering", "Mechanical Engineering", "Chemical Engineering"]}'),
('loc_student_affairs', 'Student Affairs Office', 'Administrative Building', 'admin', 'Student services, accommodation, and welfare', 7.2710, 5.1850, true, '{"opening_hours": "8:00 AM - 4:30 PM", "contact": "+234-52-250333", "building_code": "STUD-001"}'),
('loc_alumni_lodge', 'Alumni Lodge', 'Guest House', 'venue', 'Guest accommodation for visitors and alumni', 7.2920, 5.1920, true, '{"opening_hours": "24/7", "contact": "+234-52-250556", "building_code": "ALUM-001", "rooms": 30}'),
('loc_residence_hall_1', 'Residence Hall 1', 'Student Hostel', 'hostel', 'Modern residence hall for postgraduate students', 7.2750, 5.1750, true, '{"opening_hours": "24/7", "contact": "+234-52-250667", "building_code": "RESI-001", "capacity": 200}'),
('loc_internet_cafe', 'Internet Café', 'ICT Facility', 'venue', 'Internet access and printing services', 7.2720, 5.1910, true, '{"opening_hours": "7:00 AM - 10:00 PM", "contact": "+234-52-250778", "building_code": "NET-001", "computers": 40}'),
('loc_chapel', 'University Chapel', 'Religious Facility', 'venue', 'Multi-faith worship center', 7.2650, 5.1950, true, '{"opening_hours": "Variable", "contact": "+234-52-250899", "building_code": "CHAP-001", "capacity": 500}'),
('loc_innovation_hub', 'FUTA Innovation Hub', 'Research Facility', 'school', 'Center for innovation and entrepreneurship', 7.2800, 5.1980, true, '{"opening_hours": "8:00 AM - 6:00 PM", "contact": "+234-52-250555", "building_code": "INNOV-001"}'),
('loc_laboratory_complex', 'Laboratory Complex', 'Research Lab', 'school', 'Science and engineering research laboratories', 7.2820, 5.1850, true, '{"opening_hours": "7:00 AM - 7:00 PM", "contact": "+234-52-250888", "building_code": "LAB-001"}'),
('loc_parking_area_main', 'Main Parking Area', 'Parking', 'venue', 'Large parking area for students and staff', 7.2600, 5.1850, true, '{"opening_hours": "24/7", "contact": "N/A", "building_code": "PARK-001", "capacity": 500}'),
('loc_tennis_court', 'Tennis Courts', 'Sports Facility', 'venue', 'Tennis courts for recreational use', 7.2980, 5.1850, true, '{"opening_hours": "6:00 AM - 10:00 PM", "contact": "+234-52-250888", "building_code": "TENN-001", "courts": 4}'),
('loc_football_pitch', 'Football Pitch', 'Sports Facility', 'venue', 'Main football/soccer field', 7.2950, 5.1820, true, '{"opening_hours": "6:00 AM - 10:00 PM", "contact": "+234-52-250888", "building_code": "FOOT-001"}');

-- Verify the data was inserted
SELECT category, COUNT(*) as count FROM locations GROUP BY category ORDER BY category;
