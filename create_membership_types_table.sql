-- Create the membership_types table
CREATE TABLE IF NOT EXISTS membership_types (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_membership_types_modtime
BEFORE UPDATE ON membership_types
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select
CREATE POLICY select_membership_types ON membership_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY insert_membership_types ON membership_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update
CREATE POLICY update_membership_types ON membership_types
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy for authenticated users to delete
CREATE POLICY delete_membership_types ON membership_types
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default membership types if the table is empty
INSERT INTO membership_types (type, price, duration)
SELECT 'monthly', 0, 30
WHERE NOT EXISTS (SELECT 1 FROM membership_types LIMIT 1);

INSERT INTO membership_types (type, price, duration)
SELECT 'quarterly', 0, 90
WHERE NOT EXISTS (SELECT 1 FROM membership_types WHERE type = 'quarterly');

INSERT INTO membership_types (type, price, duration)
SELECT 'annual', 0, 365
WHERE NOT EXISTS (SELECT 1 FROM membership_types WHERE type = 'annual');

INSERT INTO membership_types (type, price, duration)
SELECT 'day_pass', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM membership_types WHERE type = 'day_pass');
