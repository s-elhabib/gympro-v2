/*
  # Add function to update auto_checkout_enabled

  1. Updates
    - Add a stored procedure to update the auto_checkout_enabled column
    - This bypasses RLS and allows direct updates to this specific field
*/

-- Create function to update auto_checkout_enabled
CREATE OR REPLACE FUNCTION update_auto_checkout_enabled(
  enabled BOOLEAN,
  settings_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  UPDATE gym_settings
  SET auto_checkout_enabled = enabled,
      updated_at = now()
  WHERE id = settings_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_auto_checkout_enabled TO authenticated;

-- Add comment to explain the function
COMMENT ON FUNCTION update_auto_checkout_enabled IS 'Updates the auto_checkout_enabled field for a specific gym settings record';
