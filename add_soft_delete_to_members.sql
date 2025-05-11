-- Add soft delete functionality to members table

-- Add deleted_at column to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create an index on deleted_at for better query performance
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON members(deleted_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger exists for the members table
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
