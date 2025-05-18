-- Create staff_schedules table
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_qualifications table
CREATE TABLE IF NOT EXISTS staff_qualifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  type TEXT NOT NULL CHECK (type IN ('certification', 'diploma', 'license', 'training', 'other')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_performance table
CREATE TABLE IF NOT EXISTS staff_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  evaluator TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category TEXT NOT NULL CHECK (category IN ('attendance', 'customer_service', 'technical_skills', 'teamwork', 'overall')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for staff_schedules
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to select staff_schedules"
  ON staff_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert staff_schedules"
  ON staff_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update staff_schedules"
  ON staff_schedules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete staff_schedules"
  ON staff_schedules
  FOR DELETE
  TO authenticated
  USING (true);

-- Add RLS policies for staff_qualifications
ALTER TABLE staff_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to select staff_qualifications"
  ON staff_qualifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert staff_qualifications"
  ON staff_qualifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update staff_qualifications"
  ON staff_qualifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete staff_qualifications"
  ON staff_qualifications
  FOR DELETE
  TO authenticated
  USING (true);

-- Add RLS policies for staff_performance
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to select staff_performance"
  ON staff_performance
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert staff_performance"
  ON staff_performance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update staff_performance"
  ON staff_performance
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete staff_performance"
  ON staff_performance
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_schedules_updated_at
BEFORE UPDATE ON staff_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_qualifications_updated_at
BEFORE UPDATE ON staff_qualifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_performance_updated_at
BEFORE UPDATE ON staff_performance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
