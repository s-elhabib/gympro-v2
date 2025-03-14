-- Create enum for staff roles
CREATE TYPE staff_role AS ENUM (
  'admin',
  'manager',
  'trainer',
  'receptionist',
  'maintenance'
);

-- Create enum for staff status
CREATE TYPE staff_status AS ENUM (
  'active',
  'inactive',
  'on_leave'
);

-- Create staff table
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role staff_role NOT NULL,
  hire_date DATE NOT NULL,
  status staff_status DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff members can view all staff"
  ON staff FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Only admins can insert staff"
  ON staff FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM staff WHERE role = 'admin' AND id = auth.uid()
  ));

CREATE POLICY "Only admins can update staff"
  ON staff FOR UPDATE
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM staff WHERE role = 'admin' AND id = auth.uid()
  ));

CREATE POLICY "Only admins can delete staff"
  ON staff FOR DELETE
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM staff WHERE role = 'admin' AND id = auth.uid()
  )); 