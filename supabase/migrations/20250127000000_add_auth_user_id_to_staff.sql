/*
  # Add auth_user_id to staff table for better user linking
  
  1. Updates
    - Add `auth_user_id` column to `staff` table (optional, for linking with Supabase auth users)
    - Add unique constraint on auth_user_id
    - Add index for better performance
    
  2. Notes
    - This is optional - the system will continue to work with email-based linking
    - This provides a more robust way to link staff records with auth users
*/

-- Add auth_user_id column to staff table (optional)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Add unique constraint to ensure one staff record per auth user
ALTER TABLE staff 
ADD CONSTRAINT IF NOT EXISTS unique_auth_user_id UNIQUE (auth_user_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON staff(auth_user_id);

-- Add comment to explain the column
COMMENT ON COLUMN staff.auth_user_id IS 'Optional link to Supabase auth user ID. If null, linking is done via email.';

-- Update RLS policies to also check auth_user_id
DROP POLICY IF EXISTS "Only admins can insert staff" ON staff;
CREATE POLICY "Only admins can insert staff"
  ON staff FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM staff WHERE role = 'admin' AND email = auth.email()) OR
      EXISTS (SELECT 1 FROM staff WHERE role = 'admin' AND auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Only admins can update staff" ON staff;
CREATE POLICY "Only admins can update staff"
  ON staff FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM staff WHERE role = 'admin' AND email = auth.email()) OR
      EXISTS (SELECT 1 FROM staff WHERE role = 'admin' AND auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Only admins can delete staff" ON staff;
CREATE POLICY "Only admins can delete staff"
  ON staff FOR DELETE
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM staff WHERE role = 'admin' AND email = auth.email()) OR
      EXISTS (SELECT 1 FROM staff WHERE role = 'admin' AND auth_user_id = auth.uid())
    )
  );
