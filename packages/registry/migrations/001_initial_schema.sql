-- PRMP Registry Database Schema
-- Migration 001: Initial Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,  -- Made optional - users set email when they claim account
  password_hash VARCHAR(255),  -- For email/password auth

  -- OAuth provider data
  github_id VARCHAR(100) UNIQUE,
  github_username VARCHAR(100),
  avatar_url TEXT,

  -- User status
  verified_author BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- ORGANIZATIONS
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  website_url TEXT,

  -- Organization settings
  is_verified BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_name ON organizations(name);

-- Organization membership
CREATE TABLE organization_members (
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'maintainer', 'member')),

  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY(org_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(org_id);

-- ============================================
-- PACKAGES
-- ============================================

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,  -- Package name format: @username/package-name or @org/package-name (scoped packages are strongly recommended)
  description TEXT,

  -- Ownership
  author_id UUID REFERENCES users(id),
  org_id UUID REFERENCES organizations(id),

  -- Package metadata
  type VARCHAR(50) NOT NULL CHECK (type IN ('cursor', 'claude', 'continue', 'windsurf', 'generic')),
  license VARCHAR(50),
  repository_url TEXT,
  homepage_url TEXT,
  documentation_url TEXT,

  -- Categorization
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  category VARCHAR(100),

  -- Package status
  visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  deprecated BOOLEAN DEFAULT FALSE,
  deprecated_reason TEXT,
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,

  -- Statistics (cached from package_stats)
  total_downloads INTEGER DEFAULT 0,
  weekly_downloads INTEGER DEFAULT 0,
  monthly_downloads INTEGER DEFAULT 0,
  version_count INTEGER DEFAULT 0,

  -- Quality metrics
  quality_score DECIMAL(3, 2),  -- 0.00 to 5.00
  rating_average DECIMAL(3, 2), -- 0.00 to 5.00
  rating_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_published_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for efficient querying
CREATE INDEX idx_packages_author ON packages(author_id);
CREATE INDEX idx_packages_org ON packages(org_id);
CREATE INDEX idx_packages_type ON packages(type);
CREATE INDEX idx_packages_visibility ON packages(visibility);
CREATE INDEX idx_packages_featured ON packages(featured) WHERE featured = TRUE;
CREATE INDEX idx_packages_tags ON packages USING gin(tags);
CREATE INDEX idx_packages_keywords ON packages USING gin(keywords);
CREATE INDEX idx_packages_downloads ON packages(total_downloads DESC);
CREATE INDEX idx_packages_quality ON packages(quality_score DESC NULLS LAST);
CREATE INDEX idx_packages_created ON packages(created_at DESC);

-- Full-text search index
CREATE INDEX idx_packages_search ON packages USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- ============================================
-- PACKAGE VERSIONS
-- ============================================

CREATE TABLE package_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,  -- Semantic versioning (e.g., "1.2.3")

  -- Version metadata
  description TEXT,
  changelog TEXT,

  -- File information
  tarball_url TEXT NOT NULL,     -- S3/CDN URL to .tar.gz
  content_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash
  file_size INTEGER NOT NULL,    -- Size in bytes

  -- Dependencies
  dependencies JSONB DEFAULT '{}',
  peer_dependencies JSONB DEFAULT '{}',

  -- Engine requirements
  engines JSONB DEFAULT '{}',  -- e.g., {"cursor": ">=0.40.0"}

  -- Additional metadata
  metadata JSONB DEFAULT '{}',

  -- Version status
  is_prerelease BOOLEAN DEFAULT FALSE,
  is_deprecated BOOLEAN DEFAULT FALSE,

  -- Statistics
  downloads INTEGER DEFAULT 0,

  -- Publishing info
  published_by UUID REFERENCES users(id),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(package_id, version)
);

CREATE INDEX idx_versions_package ON package_versions(package_id);
CREATE INDEX idx_versions_version ON package_versions(version);
CREATE INDEX idx_versions_published ON package_versions(published_at DESC);
CREATE INDEX idx_versions_downloads ON package_versions(downloads DESC);

-- ============================================
-- DOWNLOAD STATISTICS
-- ============================================

-- Aggregated daily download counts
CREATE TABLE package_stats (
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  version VARCHAR(50),
  date DATE NOT NULL,
  downloads INTEGER DEFAULT 0,

  PRIMARY KEY(package_id, version, date)
);

CREATE INDEX idx_stats_package ON package_stats(package_id);
CREATE INDEX idx_stats_date ON package_stats(date DESC);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

CREATE TABLE package_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,

  -- Review metadata
  helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(package_id, user_id)
);

CREATE INDEX idx_reviews_package ON package_reviews(package_id);
CREATE INDEX idx_reviews_user ON package_reviews(user_id);
CREATE INDEX idx_reviews_rating ON package_reviews(rating);
CREATE INDEX idx_reviews_created ON package_reviews(created_at DESC);

-- Track which users found reviews helpful
CREATE TABLE review_helpful (
  review_id UUID REFERENCES package_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY(review_id, user_id)
);

-- ============================================
-- ACCESS TOKENS
-- ============================================

CREATE TABLE access_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  token_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 hash of token
  name VARCHAR(255) NOT NULL,

  -- Token permissions
  scopes TEXT[] DEFAULT '{}',  -- e.g., ['read:packages', 'write:packages']

  -- Token status
  is_active BOOLEAN DEFAULT TRUE,

  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tokens_user ON access_tokens(user_id);
CREATE INDEX idx_tokens_org ON access_tokens(org_id);
CREATE INDEX idx_tokens_hash ON access_tokens(token_hash);

-- ============================================
-- PACKAGE DEPENDENCIES
-- ============================================

-- Materialized view for dependency resolution
CREATE MATERIALIZED VIEW package_dependencies AS
SELECT
  pv.package_id,
  pv.version,
  dep.key as dependency_name,
  dep.value::text as dependency_version
FROM package_versions pv
CROSS JOIN LATERAL jsonb_each(pv.dependencies) as dep;

CREATE INDEX idx_pkg_deps_package ON package_dependencies(package_id);
CREATE INDEX idx_pkg_deps_dependency ON package_dependencies(dependency_name);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action VARCHAR(100) NOT NULL,  -- e.g., 'package.publish', 'user.login'
  resource_type VARCHAR(50),     -- e.g., 'package', 'user'
  resource_id VARCHAR(255),

  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON package_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update package statistics
CREATE OR REPLACE FUNCTION update_package_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update total downloads
    UPDATE packages
    SET total_downloads = total_downloads + NEW.downloads
    WHERE id = NEW.package_id;

    -- Update weekly downloads
    UPDATE packages
    SET weekly_downloads = (
      SELECT COALESCE(SUM(downloads), 0)
      FROM package_stats
      WHERE package_id = NEW.package_id
        AND date >= CURRENT_DATE - INTERVAL '7 days'
    )
    WHERE id = NEW.package_id;

    -- Update monthly downloads
    UPDATE packages
    SET monthly_downloads = (
      SELECT COALESCE(SUM(downloads), 0)
      FROM package_stats
      WHERE package_id = NEW.package_id
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    )
    WHERE id = NEW.package_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER package_stats_updated AFTER INSERT ON package_stats
  FOR EACH ROW EXECUTE FUNCTION update_package_stats();

-- Function to update package rating average
CREATE OR REPLACE FUNCTION update_package_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE packages
  SET
    rating_average = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM package_reviews
      WHERE package_id = COALESCE(NEW.package_id, OLD.package_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM package_reviews
      WHERE package_id = COALESCE(NEW.package_id, OLD.package_id)
    )
  WHERE id = COALESCE(NEW.package_id, OLD.package_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER package_rating_updated
  AFTER INSERT OR UPDATE OR DELETE ON package_reviews
  FOR EACH ROW EXECUTE FUNCTION update_package_rating();

-- ============================================
-- SEED DATA (Development Only)
-- ============================================

-- Create prpm team user (for development and official packages)
INSERT INTO users (username, email, is_admin, verified_author)
VALUES ('prpm', 'team@pr-pm.dev', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Create test organization
INSERT INTO organizations (name, description, is_verified)
VALUES ('prpm', 'Official PRPM packages', TRUE)
ON CONFLICT DO NOTHING;
