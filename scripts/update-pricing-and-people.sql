-- Update time_slots table to set all prices to 4000
UPDATE time_slots SET price = 4000;

-- Add columns for number of people and discount applied to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS number_of_people INTEGER DEFAULT 1;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10,2) DEFAULT 0.00;

-- Update existing tickets with default values if needed
UPDATE tickets SET number_of_people = 1 WHERE number_of_people IS NULL;
UPDATE tickets SET discount_applied = 0.00 WHERE discount_applied IS NULL;

-- Add index for number_of_people if frequently queried
CREATE INDEX IF NOT EXISTS idx_tickets_people ON tickets(number_of_people);
