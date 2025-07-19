-- Add payment columns to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

-- Update time_slots table with Nigerian pricing
UPDATE time_slots SET price = 2500 WHERE time = '09:00:00';
UPDATE time_slots SET price = 2500 WHERE time = '11:00:00';
UPDATE time_slots SET price = 3000 WHERE time = '13:00:00';
UPDATE time_slots SET price = 3000 WHERE time = '15:00:00';
UPDATE time_slots SET price = 3500 WHERE time = '17:00:00';
UPDATE time_slots SET price = 3500 WHERE time = '19:00:00';

-- Add index for payment reference
CREATE INDEX IF NOT EXISTS idx_tickets_payment_reference ON tickets(payment_reference);
