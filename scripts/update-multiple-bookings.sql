-- Add columns for multiple bookings support
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) DEFAULT 'single';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS related_tickets TEXT[]; -- Array of related ticket IDs

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_booking_type ON tickets(booking_type);
CREATE INDEX IF NOT EXISTS idx_tickets_related ON tickets USING GIN(related_tickets);

-- Update existing tickets to have single booking type
UPDATE tickets SET booking_type = 'single' WHERE booking_type IS NULL;
