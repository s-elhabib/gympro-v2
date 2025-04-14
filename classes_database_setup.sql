-- =============================================
-- DATABASE SETUP FOR CLASSES FUNCTIONALITY
-- =============================================

-- Create enum types
CREATE TYPE class_category AS ENUM ('strength', 'cardio', 'flexibility', 'mind_body', 'dance', 'specialty');
CREATE TYPE class_difficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  instructor VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  duration INTEGER NOT NULL CHECK (duration >= 15),
  day day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  category class_category NOT NULL,
  difficulty class_difficulty NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class enrollments table to track members enrolled in classes
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, member_id)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_enrollments_updated_at
BEFORE UPDATE ON class_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read classes"
ON classes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert classes"
ON classes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update classes"
ON classes FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete classes"
ON classes FOR DELETE
TO authenticated
USING (true);

-- Create policies for class_enrollments
CREATE POLICY "Authenticated users can read class_enrollments"
ON class_enrollments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert class_enrollments"
ON class_enrollments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update class_enrollments"
ON class_enrollments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete class_enrollments"
ON class_enrollments FOR DELETE
TO authenticated
USING (true);

-- =============================================
-- SEED DATA FOR CLASSES
-- =============================================

-- Seed data for classes
INSERT INTO classes (name, description, instructor, capacity, duration, day, start_time, end_time, location, category, difficulty, is_active)
VALUES
  ('Power Yoga', 'Une approche vigoureuse du yoga de style vinyasa basee sur le fitness.', 'Sarah Johnson', 25, 60, 'monday', '07:00', '08:00', 'Studio A', 'mind_body', 'intermediate', true),
  ('Cours de Velo', 'Entrainement intense de cyclisme en salle sur une musique energisante.', 'Mike Davis', 20, 45, 'tuesday', '17:30', '18:15', 'Salle de Velo', 'cardio', 'all_levels', true),
  ('Entrainement HIIT', 'Entrainement par intervalles de haute intensite combinant cardio et force.', 'Alex Smith', 15, 30, 'wednesday', '12:00', '12:30', 'Zone Entrainement Fonctionnel', 'strength', 'advanced', true),
  ('Pilates Base', 'Exercices de renforcement du centre axés sur l''alignement, la respiration et le controle.', 'Emma Wilson', 15, 60, 'thursday', '18:00', '19:00', 'Studio B', 'flexibility', 'beginner', true),
  ('Zumba', 'Programme de fitness danse avec de la musique latine et internationale.', 'Maria Lopez', 30, 60, 'friday', '19:00', '20:00', 'Studio A', 'dance', 'all_levels', true),
  ('Camp d''entrainement', 'Entrainement en circuit inspire du style militaire pour un conditionnement complet du corps.', 'Jack Thompson', 20, 45, 'saturday', '09:00', '09:45', 'Zone Exterieure', 'strength', 'advanced', false);

-- Create enrollments for Power Yoga (18 enrollments)
WITH power_yoga AS (
  SELECT id FROM classes WHERE name = 'Power Yoga' LIMIT 1
),
members_for_power_yoga AS (
  SELECT id FROM members ORDER BY random() LIMIT 18
)
INSERT INTO class_enrollments (class_id, member_id, status)
SELECT 
  (SELECT id FROM power_yoga),
  m.id,
  'active'
FROM 
  members_for_power_yoga m;

-- Create enrollments for Cours de Velo (15 enrollments)
WITH velo AS (
  SELECT id FROM classes WHERE name = 'Cours de Velo' LIMIT 1
),
members_for_velo AS (
  SELECT id FROM members ORDER BY random() LIMIT 15
)
INSERT INTO class_enrollments (class_id, member_id, status)
SELECT 
  (SELECT id FROM velo),
  m.id,
  'active'
FROM 
  members_for_velo m;

-- Create enrollments for Entrainement HIIT (10 enrollments)
WITH hiit AS (
  SELECT id FROM classes WHERE name = 'Entrainement HIIT' LIMIT 1
),
members_for_hiit AS (
  SELECT id FROM members ORDER BY random() LIMIT 10
)
INSERT INTO class_enrollments (class_id, member_id, status)
SELECT 
  (SELECT id FROM hiit),
  m.id,
  'active'
FROM 
  members_for_hiit m;

-- Create enrollments for Pilates Base (12 enrollments)
WITH pilates AS (
  SELECT id FROM classes WHERE name = 'Pilates Base' LIMIT 1
),
members_for_pilates AS (
  SELECT id FROM members ORDER BY random() LIMIT 12
)
INSERT INTO class_enrollments (class_id, member_id, status)
SELECT 
  (SELECT id FROM pilates),
  m.id,
  'active'
FROM 
  members_for_pilates m;

-- Create enrollments for Zumba (25 enrollments)
WITH zumba AS (
  SELECT id FROM classes WHERE name = 'Zumba' LIMIT 1
),
members_for_zumba AS (
  SELECT id FROM members ORDER BY random() LIMIT 25
)
INSERT INTO class_enrollments (class_id, member_id, status)
SELECT 
  (SELECT id FROM zumba),
  m.id,
  'active'
FROM 
  members_for_zumba m;
