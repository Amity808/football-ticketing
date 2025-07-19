-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  available_spots INTEGER DEFAULT 10,
  price DECIMAL(10,2) DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  time_slot_id UUID REFERENCES time_slots(id),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample time slots for the next 7 days
INSERT INTO time_slots (date, time, available_spots, price) VALUES
  (CURRENT_DATE, '09:00:00', 10, 50.00),
  (CURRENT_DATE, '11:00:00', 10, 50.00),
  (CURRENT_DATE, '13:00:00', 10, 50.00),
  (CURRENT_DATE, '15:00:00', 10, 50.00),
  (CURRENT_DATE, '17:00:00', 10, 50.00),
  (CURRENT_DATE, '19:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '1 day', '09:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '1 day', '11:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '1 day', '13:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '1 day', '15:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '1 day', '17:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '1 day', '19:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '2 days', '09:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '2 days', '11:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '2 days', '13:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '2 days', '15:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '2 days', '17:00:00', 10, 50.00),
  (CURRENT_DATE + INTERVAL '2 days', '19:00:00', 10, 50.00);

-- Enable Row Level Security
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to time_slots" ON time_slots
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to tickets" ON tickets
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to tickets" ON tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to tickets" ON tickets
  FOR UPDATE USING (true);
