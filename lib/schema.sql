-- =========================================================
-- MEADOW - Schema completo para Neon PostgreSQL
-- Ejecutar una sola vez en el SQL Editor de Neon
-- =========================================================

-- USUARIOS DEL JUEGO
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  emoji VARCHAR(10) NOT NULL DEFAULT '🐻',
  color VARCHAR(7) NOT NULL DEFAULT '#6ab04c',
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESTADO DEL JUEGO POR USUARIO
CREATE TABLE IF NOT EXISTS game_state (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  coins INTEGER DEFAULT 50,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  last_tree_chop TIMESTAMPTZ,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- CULTIVOS
CREATE TABLE IF NOT EXISTS crops (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  planted_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ NOT NULL,
  harvested BOOLEAN DEFAULT FALSE,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL
);

-- ANIMALES
CREATE TABLE IF NOT EXISTS animals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  name VARCHAR(30),
  hunger INTEGER DEFAULT 100,
  last_fed TIMESTAMPTZ DEFAULT NOW(),
  last_collected TIMESTAMPTZ DEFAULT NOW()
);

-- MENSAJES DEL CHAT
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(30),
  thumbnail_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  hidden_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);

-- SUSCRIPCIONES PUSH
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONFIGURACION DEL TRIGGER SECRETO
CREATE TABLE IF NOT EXISTS trigger_config (
  id SERIAL PRIMARY KEY,
  active_object VARCHAR(50) NOT NULL DEFAULT 'mailbox',
  click_count INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONFIGURACION GENERAL
CREATE TABLE IF NOT EXISTS app_config (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL
);

-- =========================================================
-- DATOS INICIALES
-- =========================================================

INSERT INTO trigger_config (active_object, click_count)
SELECT 'mailbox', 3
WHERE NOT EXISTS (SELECT 1 FROM trigger_config);

INSERT INTO app_config (key, value) VALUES
  ('message_retention_days', '30'),
  ('weather_current', 'sunny'),
  ('weather_updated_at', NOW()::text)
ON CONFLICT (key) DO NOTHING;

-- 4 usuarios iniciales (editar nombres/emojis/colores a gusto o desde /admin)
INSERT INTO users (username, display_name, emoji, color, is_admin, notifications_enabled) VALUES
  ('user1', 'Sol',   '🌻', '#f59e0b', FALSE, TRUE),
  ('user2', 'Rio',   '🦊', '#3b82f6', FALSE, TRUE),
  ('user3', 'Luna',  '🐻', '#8b5cf6', FALSE, TRUE),
  ('user4', 'Nube',  '🐑', '#ec4899', FALSE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- Estado de juego inicial para cada usuario
INSERT INTO game_state (user_id, coins, level, xp)
SELECT id, 50, 1, 0 FROM users WHERE is_admin = FALSE
ON CONFLICT (user_id) DO NOTHING;

-- Animales iniciales para cada usuario
INSERT INTO animals (user_id, type, name)
SELECT u.id, a.type, a.name
FROM users u
CROSS JOIN (VALUES ('cow', 'Manchas'), ('chicken', 'Kiki'), ('sheep', 'Copito')) AS a(type, name)
WHERE u.is_admin = FALSE
  AND NOT EXISTS (SELECT 1 FROM animals WHERE user_id = u.id);
