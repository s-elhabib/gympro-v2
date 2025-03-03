-- Create revenue_logs table to track daily revenue
CREATE TABLE revenue_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  source VARCHAR(50) NOT NULL, -- e.g., 'membership', 'day_pass', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create attendance_stats table to track daily attendance
CREATE TABLE attendance_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_visits INTEGER NOT NULL,
  peak_hour TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add RLS policies
ALTER TABLE revenue_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for revenue_logs
CREATE POLICY "Enable read access for authenticated users on revenue_logs"
  ON revenue_logs FOR SELECT
  TO authenticated
  USING (true);

-- RLS policies for attendance_stats
CREATE POLICY "Enable read access for authenticated users on attendance_stats"
  ON attendance_stats FOR SELECT
  TO authenticated
  USING (true); 