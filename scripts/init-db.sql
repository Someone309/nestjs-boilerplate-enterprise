-- ==============================================
-- Database Initialization Script
-- This script runs when PostgreSQL container starts
-- ==============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas (optional, for multi-tenant isolation)
-- CREATE SCHEMA IF NOT EXISTS tenant_default;

-- Grant permissions
-- GRANT ALL ON SCHEMA public TO postgres;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully at %', NOW();
END
$$;
