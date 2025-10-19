-- Migration 005: Add remote MCP server tracking
-- Track which MCP servers support remote connections

-- Add remote_server field for MCP servers
ALTER TABLE packages ADD COLUMN IF NOT EXISTS remote_server BOOLEAN DEFAULT FALSE;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS remote_url TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS transport_type VARCHAR(50); -- stdio, sse, websocket

-- Add index for filtering remote MCP servers
CREATE INDEX IF NOT EXISTS idx_packages_remote_mcp ON packages(type, remote_server) WHERE type = 'mcp';

-- Add metadata field for additional MCP info
ALTER TABLE packages ADD COLUMN IF NOT EXISTS mcp_config JSONB DEFAULT '{}';

COMMENT ON COLUMN packages.remote_server IS 'Whether this MCP server supports remote connections';
COMMENT ON COLUMN packages.remote_url IS 'URL for remote MCP server connection';
COMMENT ON COLUMN packages.transport_type IS 'MCP transport protocol: stdio, sse, or websocket';
COMMENT ON COLUMN packages.mcp_config IS 'Additional MCP-specific configuration (capabilities, tools, resources)';
