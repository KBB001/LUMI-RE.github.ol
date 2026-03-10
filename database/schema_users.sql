-- ═══════════════════════════════════════════════════════════════
--  LUMIÈRE — Beauty E-Commerce
--  Database Schema: Users & Addresses
--  Engine: PostgreSQL 15+
-- ═══════════════════════════════════════════════════════════════

-- Расширение для UUID (если не включено — выполнить один раз)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────
--  ENUM: роли пользователей
-- ───────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('customer', 'admin');

-- ───────────────────────────────────────────────
--  TABLE: users
-- ───────────────────────────────────────────────
CREATE TABLE users (
    -- Первичный ключ: UUID генерируется автоматически
    id              UUID            DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Имя и фамилия
    full_name       VARCHAR(150)    NOT NULL
                        CONSTRAINT chk_full_name_length CHECK (char_length(full_name) >= 2),

    -- Email: уникальный, используется для входа
    email           VARCHAR(255)    NOT NULL UNIQUE,

    -- ⚠️  ВАЖНО: хранить ТОЛЬКО хэш пароля (bcrypt / argon2id).
    --     Никогда не сохранять пароль в открытом виде!
    --     Пример хэширования на Node.js: bcrypt.hash(password, 12)
    --     Пример на Python:               argon2.hash(password)
    password_hash   VARCHAR(255)    NOT NULL,

    -- Телефон: для уведомлений о заказах (формат +7XXXXXXXXXX)
    phone           VARCHAR(20)     UNIQUE
                        CONSTRAINT chk_phone_format
                        CHECK (phone ~ '^\+?[0-9]{10,15}$'),

    -- Ссылка на аватар (S3 / CDN)
    avatar_url      TEXT            DEFAULT NULL,

    -- Роль: customer (по умолчанию) или admin
    role            user_role       NOT NULL DEFAULT 'customer',

    -- Флаг активности аккаунта (soft-delete вместо удаления строки)
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Email подтверждён?
    email_verified  BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Метаданные времени
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_phone    ON users (phone);
CREATE INDEX idx_users_role     ON users (role);
CREATE INDEX idx_users_active   ON users (is_active) WHERE is_active = TRUE;

-- Автоматически обновлять updated_at при каждом UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────────────────────────────────────────
--  TABLE: addresses  (адреса доставки)
-- ───────────────────────────────────────────────
CREATE TABLE addresses (
    id              UUID            DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Внешний ключ: при удалении пользователя — удалить его адреса
    user_id         UUID            NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,

    -- Метка адреса (Дом, Работа, и т. д.)
    label           VARCHAR(50)     DEFAULT 'Дом',

    -- Получатель (может отличаться от владельца аккаунта — подарок)
    recipient_name  VARCHAR(150)    NOT NULL,

    -- Телефон получателя
    recipient_phone VARCHAR(20)     NOT NULL
                        CONSTRAINT chk_addr_phone
                        CHECK (recipient_phone ~ '^\+?[0-9]{10,15}$'),

    -- Страна
    country         VARCHAR(100)    NOT NULL DEFAULT 'Казахстан',

    -- Город
    city            VARCHAR(100)    NOT NULL,

    -- Улица и дом
    street          VARCHAR(255)    NOT NULL,

    -- Квартира / офис (необязательно)
    apartment       VARCHAR(50)     DEFAULT NULL,

    -- Почтовый индекс
    postal_code     VARCHAR(20)     DEFAULT NULL,

    -- Дополнительные инструкции курьеру
    delivery_notes  TEXT            DEFAULT NULL,

    -- Основной адрес пользователя (только один может быть TRUE)
    is_default      BOOLEAN         NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_addresses_user_id   ON addresses (user_id);
CREATE INDEX idx_addresses_default   ON addresses (user_id, is_default)
    WHERE is_default = TRUE;

-- Ограничение: только ОДИН адрес по умолчанию на пользователя
CREATE UNIQUE INDEX uniq_default_address
    ON addresses (user_id)
    WHERE is_default = TRUE;

-- Триггер обновления updated_at
CREATE TRIGGER trg_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────────────────────────────────────────
--  TABLE: user_sessions  (опционально)
--  Хранит refresh-токены для JWT авторизации
-- ───────────────────────────────────────────────
CREATE TABLE user_sessions (
    id              UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID            NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   TEXT            NOT NULL UNIQUE,
    user_agent      TEXT,
    ip_address      INET,
    expires_at      TIMESTAMPTZ     NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id      ON user_sessions (user_id);
CREATE INDEX idx_sessions_expires_at   ON user_sessions (expires_at);

-- ───────────────────────────────────────────────
--  ТЕСТОВЫЕ ДАННЫЕ (seed)
--  ⚠️  Только для разработки! Удалить в продакшене.
-- ───────────────────────────────────────────────
INSERT INTO users (full_name, email, password_hash, phone, role, email_verified)
VALUES
    (
        'Айна Бекова',
        'aina@lumiere.kz',
        -- bcrypt-хэш строки "admin_secret_2024" (rounds=12)
        '$2b$12$eIY3K5QjQ8Hv7EfGvC1XsehzQzJqNy2Wj.Y3iOHexample1hash',
        '+77771234567',
        'admin',
        TRUE
    ),
    (
        'Динара Сейткали',
        'dinara@example.kz',
        -- bcrypt-хэш строки "customer_pass" (rounds=12)
        '$2b$12$Kf7mLpNqR9Bv5CgHwD2YteGxPzKwMy3Vs.A1jFKexample2hash',
        '+77012345678',
        'customer',
        FALSE
    );

INSERT INTO addresses (user_id, label, recipient_name, recipient_phone, city, street, postal_code, is_default)
VALUES (
    (SELECT id FROM users WHERE email = 'dinara@example.kz'),
    'Дом',
    'Динара Сейткали',
    '+77012345678',
    'Алматы',
    'ул. Абая, 10, кв. 25',
    '050000',
    TRUE
);
