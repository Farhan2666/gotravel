CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  description TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  route_from TEXT NOT NULL,
  route_to TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  duration TEXT NOT NULL DEFAULT '2h 30m',
  departure_time TEXT DEFAULT '08:00',
  arrival_time TEXT DEFAULT '10:30',
  seat_layout JSONB NOT NULL DEFAULT '{"rows":6,"columns":4,"labels":["A","B","C","D"],"layout":"standard"}',
  total_seats INT NOT NULL DEFAULT 24,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
