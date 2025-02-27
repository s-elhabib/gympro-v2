/*
  # Create payments table and related schemas

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `member_id` (uuid, references members)
      - `amount` (numeric)
      - `payment_date` (timestamptz)
      - `due_date` (timestamptz)
      - `status` (payment_status)
      - `payment_method` (payment_method)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. New Types
    - `payment_status`: Enum for payment status
    - `payment_method`: Enum for payment methods

  3. Security
    - Enable RLS on payments table
    - Add policies for authenticated users
*/

-- Create payment_status enum
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue', 'cancelled');

-- Create payment_method enum
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'other');

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  payment_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON payments FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON payments FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
ON payments FOR DELETE
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create index for faster queries
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_status ON payments(status);