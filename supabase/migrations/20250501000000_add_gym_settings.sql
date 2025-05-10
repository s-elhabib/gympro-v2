/*
  # Add gym_settings table

  1. New Tables
    - `gym_settings`
      - `id` (uuid, primary key)
      - `auto_checkout_minutes` (integer, default 240 = 4 hours)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `gym_settings` table
    - Add policies for authenticated users to:
      - Read gym settings
      - Update gym settings (admin only)
*/

-- Create gym_settings table
CREATE TABLE IF NOT EXISTS gym_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_checkout_minutes integer NOT NULL DEFAULT 240,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add comment to explain the column
COMMENT ON COLUMN gym_settings.auto_checkout_minutes IS 'Time in minutes after which a member is automatically checked out (default: 240 minutes = 4 hours)';

-- Enable RLS
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read gym_settings"
  ON gym_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin users to update gym_settings"
  ON gym_settings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM staff WHERE role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO gym_settings (auto_checkout_minutes)
VALUES (240);

-- Create trigger to update updated_at
CREATE TRIGGER update_gym_settings_updated_at
  BEFORE UPDATE ON gym_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
