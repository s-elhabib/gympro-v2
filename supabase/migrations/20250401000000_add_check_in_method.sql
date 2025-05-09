/*
  # Add check_in_method to attendance table

  1. Updates
    - Add `check_in_method` column to `attendance` table
    - Create enum type for check-in methods
    - Set default value to 'manual' for existing records
*/

-- Create check_in_method enum
CREATE TYPE check_in_method AS ENUM ('manual', 'qr_code');

-- Add check_in_method column to attendance table
ALTER TABLE attendance 
ADD COLUMN check_in_method check_in_method NOT NULL DEFAULT 'manual';

-- Add comment to explain the column
COMMENT ON COLUMN attendance.check_in_method IS 'Method used for check-in: manual or qr_code';
