-- First, create a temporary column to hold the membership type as text
ALTER TABLE members ADD COLUMN membership_type_text TEXT;

-- Copy the existing membership_type values to the new column
UPDATE members SET membership_type_text = membership_type::TEXT;

-- Drop the constraint that uses the enum
ALTER TABLE members ALTER COLUMN membership_type DROP NOT NULL;

-- Drop the default value that uses the enum
ALTER TABLE members ALTER COLUMN membership_type DROP DEFAULT;

-- Drop the column that uses the enum
ALTER TABLE members DROP COLUMN membership_type;

-- Rename the text column to membership_type
ALTER TABLE members RENAME COLUMN membership_type_text TO membership_type;

-- Add NOT NULL constraint to the new column
ALTER TABLE members ALTER COLUMN membership_type SET NOT NULL;

-- Add a default value to the new column
ALTER TABLE members ALTER COLUMN membership_type SET DEFAULT 'basic';

-- Create a mapping function to convert between old enum values and new string values
CREATE OR REPLACE FUNCTION map_membership_type(type_value TEXT) RETURNS TEXT AS $$
BEGIN
  CASE type_value
    WHEN 'basic' THEN RETURN 'basic';
    WHEN 'premium' THEN RETURN 'premium';
    WHEN 'platinum' THEN RETURN 'platinum';
    WHEN 'monthly' THEN RETURN 'monthly';
    WHEN 'quarterly' THEN RETURN 'quarterly';
    WHEN 'annual' THEN RETURN 'annual';
    WHEN 'day_pass' THEN RETURN 'day_pass';
    ELSE RETURN type_value;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update any existing records to use the mapped values
UPDATE members SET membership_type = map_membership_type(membership_type);

-- Drop the mapping function as it's no longer needed
DROP FUNCTION map_membership_type(TEXT);
