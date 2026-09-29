-- Farm Records + Education platform schema
-- Run this once against your database to create all tables.

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  farm_size_type VARCHAR(20) CHECK (farm_size_type IN ('small', 'large')),
  role VARCHAR(20) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE farms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(200),
  size_hectares NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE crops (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_name VARCHAR(100) NOT NULL,
  planting_date DATE,
  harvest_date DATE,
  status VARCHAR(30) DEFAULT 'planted',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE livestock (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  animal_type VARCHAR(100) NOT NULL,
  animal_count INTEGER NOT NULL DEFAULT 0,
  health_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  txn_type VARCHAR(10) CHECK (txn_type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL,
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes on foreign keys speed up the "get all crops for this farm"
-- type of query, which we'll run constantly.
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_crops_farm_id ON crops(farm_id);
CREATE INDEX idx_livestock_farm_id ON livestock(farm_id);
CREATE INDEX idx_transactions_farm_id ON transactions(farm_id);
