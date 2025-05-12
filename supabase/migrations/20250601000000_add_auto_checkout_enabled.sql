/*
  # Add auto_checkout_enabled to gym_settings table

  1. Updates
    - Add `auto_checkout_enabled` column to `gym_settings` table
    - Set default value to true for existing records
*/

-- Add auto_checkout_enabled column to gym_settings table
ALTER TABLE gym_settings 
ADD COLUMN IF NOT EXISTS auto_checkout_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Add comment to explain the column
COMMENT ON COLUMN gym_settings.auto_checkout_enabled IS 'Whether automatic checkout is enabled (default: true)';
