-- Script to fix the valid_membership_type constraint

-- First, let's check the current constraint definition
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM
    pg_constraint
WHERE
    conname = 'valid_membership_type';

-- Let's also check what values are currently in the members table
SELECT DISTINCT
    membership_type
FROM
    members
ORDER BY
    membership_type;

-- Let's check what values are in the membership_types table
SELECT DISTINCT
    type
FROM
    membership_types
ORDER BY
    type;

-- Now, let's drop the existing constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS valid_membership_type;

-- And create a new one that includes all necessary values
-- This includes the old enum values (basic, premium, platinum) and the new types in French
ALTER TABLE members ADD CONSTRAINT valid_membership_type
    CHECK (membership_type IN ('Mensuel', 'Trimestriel', 'Annuel', 'Accès Journalier', 'basic', 'premium', 'platinum'));

-- Let's verify the new constraint
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM
    pg_constraint
WHERE
    conname = 'valid_membership_type';

-- Now let's update any members that still have old membership types
UPDATE members
SET membership_type = 'Mensuel'
WHERE membership_type = 'basic';

UPDATE members
SET membership_type = 'Trimestriel'
WHERE membership_type = 'premium';

UPDATE members
SET membership_type = 'Annuel'
WHERE membership_type = 'platinum';

-- Also update any members with English names to French names
UPDATE members
SET membership_type = 'Mensuel'
WHERE membership_type = 'monthly';

UPDATE members
SET membership_type = 'Trimestriel'
WHERE membership_type = 'quarterly';

UPDATE members
SET membership_type = 'Annuel'
WHERE membership_type = 'annual';

UPDATE members
SET membership_type = 'Accès Journalier'
WHERE membership_type = 'day_pass';

-- Let's check if there are any members left with old membership types
SELECT
    membership_type,
    COUNT(*) as count
FROM
    members
GROUP BY
    membership_type
ORDER BY
    membership_type;
