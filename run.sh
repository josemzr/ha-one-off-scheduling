#!/usr/bin/with-contenv bashio

# Set environment variables
export PORT="3000"
export HA_URL="http://supervisor/core"
export HA_TOKEN="${SUPERVISOR_TOKEN}"
export INGRESS_PATH="${INGRESS_PATH:-}"

# MCP authentication token (optional but recommended)
if bashio::config.has_value 'mcp_auth_token'; then
  export MCP_AUTH_TOKEN="$(bashio::config 'mcp_auth_token')"
  bashio::log.info "MCP authentication: enabled"
else
  bashio::log.warning "MCP_AUTH_TOKEN not set — MCP endpoint is unauthenticated!"
fi

bashio::log.info "Starting One-Off Scheduling add-on..."
bashio::log.info "Port: ${PORT}"
bashio::log.info "Home Assistant URL: ${HA_URL}"
bashio::log.info "Ingress Path: ${INGRESS_PATH}"
bashio::log.info "MCP endpoint: http://<host-ip>:3000/mcp"

# Start the Node.js application
cd /app || exit 1
exec node server.js
