-- SkillMap — Schéma complet de la base de données SQLite
-- Exécuté automatiquement par database/init.js

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ─── UTILISATEURS (base commune) ────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'client' CHECK(role IN ('client','provider','admin')),
  full_name   TEXT    NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  city        TEXT    DEFAULT 'Abidjan',
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT    DEFAULT (datetime('now')),
  updated_at  TEXT    DEFAULT (datetime('now'))
);

-- ─── PROFILS PRESTATAIRES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS providers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL,           -- "Plombier", "Graphiste"…
  description     TEXT,
  city            TEXT    DEFAULT 'Abidjan',
  neighborhood    TEXT,                       -- Quartier
  lat             REAL,
  lng             REAL,
  is_available    INTEGER DEFAULT 1,
  is_verified     INTEGER DEFAULT 0,
  hourly_rate     REAL,
  experience_years INTEGER DEFAULT 0,
  views_count     INTEGER DEFAULT 0,
  created_at      TEXT    DEFAULT (datetime('now')),
  updated_at      TEXT    DEFAULT (datetime('now'))
);

-- ─── CATÉGORIES DE SERVICES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL UNIQUE,
  slug  TEXT    NOT NULL UNIQUE,
  icon  TEXT    DEFAULT '<i data-lucide="wrench"></i>'
);

-- ─── PRESTATAIRES ↔ CATÉGORIES ───────────────────────────────
CREATE TABLE IF NOT EXISTS provider_categories (
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, category_id)
);

-- ─── COMPÉTENCES DES PRESTATAIRES ────────────────────────────
CREATE TABLE IF NOT EXISTS provider_skills (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  skill       TEXT    NOT NULL
);

-- ─── PORTFOLIO ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  image_url   TEXT,
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ─── DEMANDES DE SERVICE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id    INTEGER NOT NULL REFERENCES users(id),
  provider_id  INTEGER NOT NULL REFERENCES providers(id),
  title        TEXT    NOT NULL,
  description  TEXT,
  status       TEXT    DEFAULT 'pending'
                CHECK(status IN ('pending','accepted','in_progress','completed','cancelled','rejected')),
  scheduled_at TEXT,
  completed_at TEXT,
  created_at   TEXT    DEFAULT (datetime('now')),
  updated_at   TEXT    DEFAULT (datetime('now'))
);

-- ─── AVIS ET NOTATIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id  INTEGER REFERENCES service_requests(id),
  client_id   INTEGER NOT NULL REFERENCES users(id),
  provider_id INTEGER NOT NULL REFERENCES providers(id),
  rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_visible  INTEGER DEFAULT 1,
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ─── FAVORIS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  client_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  created_at  TEXT    DEFAULT (datetime('now')),
  PRIMARY KEY (client_id, provider_id)
);

-- ─── MESSAGES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id   INTEGER NOT NULL REFERENCES users(id),
  receiver_id INTEGER NOT NULL REFERENCES users(id),
  content     TEXT    NOT NULL,
  is_read     INTEGER DEFAULT 0,
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ─── SIGNALEMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  provider_id INTEGER NOT NULL REFERENCES providers(id),
  reason      TEXT    NOT NULL CHECK(reason IN ('fake','inappropriate','spam','other')),
  description TEXT,
  status      TEXT    DEFAULT 'pending' CHECK(status IN ('pending','reviewed','dismissed')),
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ─── RENDEZ-VOUS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id          INTEGER NOT NULL REFERENCES users(id),
  provider_id        INTEGER NOT NULL REFERENCES providers(id),
  service_request_id INTEGER REFERENCES service_requests(id),
  title              TEXT NOT NULL,
  description        TEXT,
  scheduled_date     TEXT NOT NULL,
  scheduled_time     TEXT DEFAULT '09:00',
  duration_hours     REAL DEFAULT 1,
  amount             REAL DEFAULT 0,
  status             TEXT DEFAULT 'pending'
                     CHECK(status IN ('pending','confirmed','in_progress','en_route','completed','cancelled')),
  payment_status     TEXT DEFAULT 'unpaid'
                     CHECK(payment_status IN ('unpaid','held','released','refunded')),
  client_confirmed   INTEGER DEFAULT 0,
  provider_confirmed INTEGER DEFAULT 0,
  notes              TEXT,
  created_at         TEXT DEFAULT (datetime('now')),
  updated_at         TEXT DEFAULT (datetime('now'))
);

-- ─── PORTEFEUILLES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance      REAL DEFAULT 0,
  held_balance REAL DEFAULT 0,
  total_earned REAL DEFAULT 0,
  total_spent  REAL DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- ─── TRANSACTIONS PORTEFEUILLE ───────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id      INTEGER NOT NULL REFERENCES wallets(id),
  type           TEXT NOT NULL CHECK(type IN ('deposit','payment','receipt','commission','refund','held','released')),
  amount         REAL NOT NULL,
  fee            REAL DEFAULT 0,
  net_amount     REAL,
  description    TEXT,
  status         TEXT DEFAULT 'completed' CHECK(status IN ('pending','completed','failed')),
  payment_method TEXT,
  reference      TEXT,
  appointment_id INTEGER REFERENCES appointments(id),
  created_at     TEXT DEFAULT (datetime('now'))
);

-- ─── PRIX DE BASE PAR CATÉGORIE ET NIVEAU ────────────────────
CREATE TABLE IF NOT EXISTS category_base_prices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  category_slug TEXT    NOT NULL,
  level         TEXT    NOT NULL DEFAULT 'débutant'
                CHECK(level IN ('débutant','confirmé','expert','master')),
  base_rate     REAL    NOT NULL,
  UNIQUE(category_slug, level)
);

-- Prix de base recommandés par la plateforme (FCFA/heure)
INSERT OR IGNORE INTO category_base_prices (category_slug, level, base_rate) VALUES
  ('artisanat',  'débutant', 2500), ('artisanat',  'confirmé', 3500), ('artisanat',  'expert', 5000),  ('artisanat',  'master', 7000),
  ('electricite','débutant', 3500), ('electricite','confirmé', 5000), ('electricite','expert', 7000),  ('electricite','master',10000),
  ('plomberie',  'débutant', 3000), ('plomberie',  'confirmé', 4000), ('plomberie',  'expert', 5500),  ('plomberie',  'master', 7500),
  ('beaute',     'débutant', 2000), ('beaute',     'confirmé', 3000), ('beaute',     'expert', 4500),  ('beaute',     'master', 6500),
  ('design',     'débutant', 5000), ('design',     'confirmé', 7500), ('design',     'expert',12000),  ('design',     'master',18000),
  ('education',  'débutant', 3000), ('education',  'confirmé', 4500), ('education',  'expert', 6500),  ('education',  'master', 9000),
  ('telephonie', 'débutant', 3500), ('telephonie', 'confirmé', 5000), ('telephonie', 'expert', 7500),  ('telephonie', 'master',12000),
  ('mecanique',  'débutant', 4000), ('mecanique',  'confirmé', 5500), ('mecanique',  'expert', 8000),  ('mecanique',  'master',12000),
  ('couture',    'débutant', 2500), ('couture',    'confirmé', 3500), ('couture',    'expert', 5000),  ('couture',    'master', 7000),
  ('cuisine',    'débutant', 3000), ('cuisine',    'confirmé', 4500), ('cuisine',    'expert', 6500),  ('cuisine',    'master', 9000);

-- ─── INDEX pour les performances ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_providers_available ON providers(is_available);
CREATE INDEX IF NOT EXISTS idx_providers_lat_lng   ON providers(lat, lng);
CREATE INDEX IF NOT EXISTS idx_providers_city      ON providers(city);
CREATE INDEX IF NOT EXISTS idx_reviews_provider    ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver   ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider ON service_requests(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_client   ON service_requests(client_id, status);
