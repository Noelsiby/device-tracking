-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  serial TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inventory',
  location TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Users (simplified)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMP,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'assigned',
  return_photo TEXT
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  comments TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Maintenance
CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  maintenance_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
);
