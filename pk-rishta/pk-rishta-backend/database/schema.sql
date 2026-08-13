-- PK Rishta - Matrimonial Database Schema
-- Pakistan-focused matrimonial platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matrimonial profiles
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    gender          VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    date_of_birth   DATE NOT NULL,
    height_cm       INTEGER,
    marital_status  VARCHAR(20)
                    CHECK (marital_status IS NULL OR marital_status IN ('never_married', 'divorced', 'widowed', 'separated')),
    religion        VARCHAR(50) NOT NULL DEFAULT 'Islam',
    sect            VARCHAR(50),
    caste           VARCHAR(200),
    mother_tongue   VARCHAR(200),
    city            VARCHAR(100) NOT NULL,
    province        VARCHAR(100) NOT NULL,
    country         VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
    education       TEXT,
    profession      TEXT,
    income_range    VARCHAR(50),
    about_me        TEXT,
    looking_for     TEXT,
    family_details  TEXT,
    profile_photo   VARCHAR(500),
    is_profile_complete BOOLEAN NOT NULL DEFAULT false,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    visibility      VARCHAR(20) NOT NULL DEFAULT 'public'
                    CHECK (visibility IN ('public', 'members_only', 'hidden')),
    profile_views   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partner preferences
CREATE TABLE IF NOT EXISTS partner_preferences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    min_age         INTEGER DEFAULT 18,
    max_age         INTEGER DEFAULT 45,
    min_height_cm   INTEGER,
    max_height_cm   INTEGER,
    religion        VARCHAR(50),
    sect            VARCHAR(50),
    city            VARCHAR(100),
    province        VARCHAR(100),
    country         VARCHAR(100),
    education       TEXT,
    profession      TEXT,
    marital_status  VARCHAR(20),
    requirements_notes TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE partner_preferences ADD COLUMN IF NOT EXISTS requirements_notes TEXT;
ALTER TABLE partner_preferences ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE partner_preferences ADD COLUMN IF NOT EXISTS caste VARCHAR(200);

-- Overseas location support (existing databases)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100) NOT NULL DEFAULT 'Pakistan';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disability VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS house_own_location VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS house_rent_location VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abroad_country VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abroad_house_own_location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abroad_house_rent_location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardian_type VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(150);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE profiles ALTER COLUMN education TYPE TEXT;
ALTER TABLE profiles ALTER COLUMN profession TYPE TEXT;
ALTER TABLE profiles ALTER COLUMN mother_tongue TYPE VARCHAR(200);
ALTER TABLE profiles ALTER COLUMN caste TYPE VARCHAR(200);
ALTER TABLE partner_preferences ALTER COLUMN education TYPE TEXT;
ALTER TABLE partner_preferences ALTER COLUMN profession TYPE TEXT;
ALTER TABLE partner_preferences ALTER COLUMN caste TYPE TEXT;
ALTER TABLE partner_preferences ALTER COLUMN city TYPE TEXT;
ALTER TABLE partner_preferences ALTER COLUMN province TYPE TEXT;
UPDATE profiles SET sect = 'Ahle Hadees' WHERE sect ILIKE 'ahl%hadith%' OR sect ILIKE 'ahle%hadees%';
UPDATE partner_preferences SET sect = 'Ahle Hadees' WHERE sect ILIKE 'ahl%hadith%' OR sect ILIKE 'ahle%hadees%';
ALTER TABLE profiles ALTER COLUMN marital_status DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN province DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN religion DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN mother_tongue DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN country TYPE VARCHAR(100);
UPDATE profiles SET country = 'Pakistan' WHERE country IS NULL OR TRIM(country) = '';

ALTER TABLE profile_contacts ALTER COLUMN number TYPE VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles(province);

-- Remove deprecated featured flag
DROP INDEX IF EXISTS idx_profiles_is_featured;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_featured;

-- Interest / proposal requests
CREATE TABLE IF NOT EXISTS interests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    message         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Saved favorites
CREATE TABLE IF NOT EXISTS favorites (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    favorite_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, favorite_id)
);

-- Profile photos gallery
CREATE TABLE IF NOT EXISTS profile_photos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url       VARCHAR(500) NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profile contact numbers (phone / WhatsApp)
CREATE TABLE IF NOT EXISTS profile_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contact_type    VARCHAR(20) NOT NULL CHECK (contact_type IN ('phone', 'whatsapp')),
    number          VARCHAR(50) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action          VARCHAR(100) NOT NULL,
    target_type     VARCHAR(50),
    target_id       UUID,
    details         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact access requests (target user + admin can respond)
CREATE TABLE IF NOT EXISTS contact_access_requests (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    user_message            TEXT,
    admin_message           TEXT,
    reviewed_by             UUID REFERENCES users(id),
    response_source         VARCHAR(20),
    reviewed_at             TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_requests_pending_unique
    ON contact_access_requests (requester_profile_id, target_profile_id)
    WHERE status = 'pending';

-- User complaints / reports
CREATE TABLE IF NOT EXISTS complaints (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category                VARCHAR(50) NOT NULL,
    description             TEXT NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'resolved', 'dismissed')),
    admin_notes             TEXT,
    reviewed_by             UUID REFERENCES users(id),
    reviewed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Complaint message thread (admin, reporter, reported user)
CREATE TABLE IF NOT EXISTS complaint_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    sender_role     VARCHAR(20) NOT NULL CHECK (sender_role IN ('admin', 'reporter', 'reported')),
    sender_user_id  UUID REFERENCES users(id),
    message         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint ON complaint_messages(complaint_id);

-- Public contact page messages (Send Us a Message)
CREATE TABLE IF NOT EXISTS contact_form_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    subject         VARCHAR(50) NOT NULL,
    message         TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'read', 'replied', 'archived')),
    admin_notes     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_form_messages_status ON contact_form_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_form_messages_email ON contact_form_messages(email);

-- Unique daily site visitors (Pakistan calendar day)
CREATE TABLE IF NOT EXISTS site_visitors_daily (
    visit_date      DATE NOT NULL,
    visitor_key     VARCHAR(64) NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    page_views      INTEGER NOT NULL DEFAULT 1,
    last_path       VARCHAR(200),
    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (visit_date, visitor_key)
);

CREATE INDEX IF NOT EXISTS idx_site_visitors_daily_date ON site_visitors_daily(visit_date);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_contacts_profile ON profile_contacts(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles(province);
CREATE INDEX IF NOT EXISTS idx_profiles_marital_status ON profiles(marital_status);
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON profiles(visibility);
CREATE INDEX IF NOT EXISTS idx_interests_receiver ON interests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_interests_sender ON interests(sender_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_access_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_requester ON contact_access_requests(requester_profile_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_target ON contact_access_requests(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status, created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Admin-managed dropdown options (extra values beyond built-in lists)
CREATE TABLE IF NOT EXISTS dropdown_options (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_key       VARCHAR(50) NOT NULL,
    category        VARCHAR(100),
    label           TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dropdown_options_unique
  ON dropdown_options (field_key, COALESCE(category, ''), lower(label));
CREATE INDEX IF NOT EXISTS idx_dropdown_options_field ON dropdown_options(field_key, is_active, sort_order);

-- User requests to add a missing dropdown option
CREATE TABLE IF NOT EXISTS dropdown_option_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    requester_name  VARCHAR(150),
    requester_email VARCHAR(255),
    field_key       VARCHAR(50) NOT NULL,
    category        VARCHAR(100),
    requested_label TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes     TEXT,
    reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dropdown_option_requests_status
  ON dropdown_option_requests(status, created_at DESC);

-- In-app notifications (bell)
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    body            TEXT,
    link            VARCHAR(500),
    related_id      UUID,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- Existing DBs: allow expired status + response_source
DO $$
DECLARE
  r RECORD;
BEGIN
  ALTER TABLE contact_access_requests
    ADD COLUMN IF NOT EXISTS response_source VARCHAR(20);

  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'contact_access_requests'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  ) LOOP
    EXECUTE format('ALTER TABLE contact_access_requests DROP CONSTRAINT %I', r.conname);
  END LOOP;

  ALTER TABLE contact_access_requests
    ADD CONSTRAINT contact_access_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Auth OTPs (email verify + password reset)
CREATE TABLE IF NOT EXISTS auth_otps (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL,
    purpose       VARCHAR(30) NOT NULL
                  CHECK (purpose IN ('email_verify', 'password_reset')),
    code_hash     VARCHAR(255) NOT NULL,
    attempts      INTEGER NOT NULL DEFAULT 0,
    max_attempts  INTEGER NOT NULL DEFAULT 5,
    expires_at    TIMESTAMPTZ NOT NULL,
    consumed_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_email_purpose_active
  ON auth_otps(email, purpose, created_at DESC)
  WHERE consumed_at IS NULL;
