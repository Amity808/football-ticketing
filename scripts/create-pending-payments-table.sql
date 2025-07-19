-- Create pending_payments table to store payment metadata
CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference VARCHAR(100) UNIQUE NOT NULL,
  metadata JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by reference
CREATE INDEX IF NOT EXISTS idx_pending_payments_reference ON pending_payments(reference);

-- Enable Row Level Security for pending_payments
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Allow public insert access (for initiatePayment)
CREATE POLICY "Allow public insert access to pending_payments" ON pending_payments
  FOR INSERT WITH CHECK (true);

-- Allow public read access (for verifyPaymentAndCreateTicket)
CREATE POLICY "Allow public read access to pending_payments" ON pending_payments
  FOR SELECT USING (true);

-- Allow public update access (for verifyPaymentAndCreateTicket to mark as completed/failed)
CREATE POLICY "Allow public update access to pending_payments" ON pending_payments
  FOR UPDATE USING (true);

-- Create updated_at trigger for pending_payments
CREATE OR REPLACE FUNCTION update_pending_payments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pending_payments_updated_at
    BEFORE UPDATE ON pending_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_pending_payments_updated_at_column();
