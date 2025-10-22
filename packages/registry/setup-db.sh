#!/bin/bash
# Database setup script for PRPM

echo "🔧 Setting up PRPM database..."

# Try to connect as the postgres user (default superuser)
# Create database and user if they don't exist

sudo -u postgres psql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'prpm') THEN
    CREATE USER prpm WITH PASSWORD 'prpm';
  ELSE
    ALTER USER prpm WITH PASSWORD 'prpm';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE prpm_registry'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'prpm_registry')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE prpm_registry TO prpm;

\c prpm_registry

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO prpm;

EOF

echo "✅ Database setup complete!"
echo ""
echo "You can now run migrations:"
echo "  npm run migrate"
