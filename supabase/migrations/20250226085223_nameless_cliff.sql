/*
  # Fix RLS policies for members and attendance tables

  1. Security Updates
    - Drop existing policies
    - Create new, more permissive policies for development
    - Enable RLS on both tables
    
  Note: In production, you would want more restrictive policies
*/

-- Fix Members table policies
DROP POLICY IF EXISTS "Allow authenticated users to read members" ON members;
DROP POLICY IF EXISTS "Allow authenticated users to create members" ON members;
DROP POLICY IF EXISTS "Allow authenticated users to update members" ON members;
DROP POLICY IF EXISTS "Allow authenticated users to delete members" ON members;

CREATE POLICY "Enable read access for all users"
ON members FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON members FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON members FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
ON members FOR DELETE
USING (true);

-- Fix Attendance table policies
DROP POLICY IF EXISTS "Allow authenticated users to read attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated users to create attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated users to update attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated users to delete attendance" ON attendance;

CREATE POLICY "Enable read access for all users"
ON attendance FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON attendance FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON attendance FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
ON attendance FOR DELETE
USING (true);