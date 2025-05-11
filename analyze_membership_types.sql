-- SQL script to analyze and report on membership types in the database
-- This script will:
-- 1. Show the current enum values for membership_type
-- 2. Count members by membership type
-- 3. Provide recommendations for migration

-- Start a transaction so we can roll back if needed
BEGIN;

-- Check the current enum values for membership_type
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM 
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE 
    t.typname = 'membership_type'
ORDER BY 
    e.enumsortorder;

-- Count members by membership type
SELECT 
    membership_type::text,
    COUNT(*) as member_count
FROM 
    members
GROUP BY 
    membership_type
ORDER BY 
    COUNT(*) DESC;

-- Count membership types in the membership_types table
SELECT 
    type,
    COUNT(*) as count
FROM 
    membership_types
GROUP BY 
    type
ORDER BY 
    COUNT(*) DESC;

-- Create a temporary table to store the mapping between old and new types
CREATE TEMP TABLE membership_type_mapping (
    old_type TEXT,
    new_type TEXT
);

-- Insert the mapping values
INSERT INTO membership_type_mapping (old_type, new_type) VALUES
('basic', 'monthly'),
('premium', 'quarterly'),
('platinum', 'annual');

-- Show the mapping
SELECT * FROM membership_type_mapping;

-- Show which members would be updated
SELECT 
    m.id,
    m.first_name || ' ' || m.last_name AS member_name,
    m.membership_type::text AS current_type,
    mtm.new_type AS target_type
FROM 
    members m
    JOIN membership_type_mapping mtm ON m.membership_type::text = mtm.old_type
ORDER BY 
    m.first_name, m.last_name;

-- Count how many members would be updated
SELECT 
    COUNT(*) AS members_to_update
FROM 
    members m
    JOIN membership_type_mapping mtm ON m.membership_type::text = mtm.old_type;

-- Rollback the transaction since this is just an analysis
ROLLBACK;

-- Migration instructions
/*
MIGRATION INSTRUCTIONS:

Based on the analysis above, you have two options:

OPTION 1: Modify the membership_type enum to include the new values
This requires ALTER TYPE which may require superuser privileges:

ALTER TYPE membership_type ADD VALUE IF NOT EXISTS 'monthly';
ALTER TYPE membership_type ADD VALUE IF NOT EXISTS 'quarterly';
ALTER TYPE membership_type ADD VALUE IF NOT EXISTS 'annual';
ALTER TYPE membership_type ADD VALUE IF NOT EXISTS 'day_pass';

Then you can run the update statements:

UPDATE members SET membership_type = 'monthly'::membership_type WHERE membership_type = 'basic'::membership_type;
UPDATE members SET membership_type = 'quarterly'::membership_type WHERE membership_type = 'premium'::membership_type;
UPDATE members SET membership_type = 'annual'::membership_type WHERE membership_type = 'platinum'::membership_type;

OPTION 2: Change the column type from enum to text
This is more involved but gives you more flexibility:

1. Create a new column:
   ALTER TABLE members ADD COLUMN new_membership_type TEXT;

2. Copy data with mapping:
   UPDATE members SET new_membership_type = 
     CASE 
       WHEN membership_type = 'basic'::membership_type THEN 'monthly'
       WHEN membership_type = 'premium'::membership_type THEN 'quarterly'
       WHEN membership_type = 'platinum'::membership_type THEN 'annual'
       ELSE membership_type::text
     END;

3. Drop the old column and rename the new one:
   ALTER TABLE members DROP COLUMN membership_type;
   ALTER TABLE members RENAME COLUMN new_membership_type TO membership_type;

4. Add constraints if needed:
   ALTER TABLE members ADD CONSTRAINT valid_membership_type 
     CHECK (membership_type IN ('monthly', 'quarterly', 'annual', 'day_pass'));
*/
