#!/usr/bin/with-contenv bashio

# Set environment variables
export PORT="3000"
export HA_URL="http://supervisor/core"
export HA_TOKEN="${SUPERVISOR_TOKEN}"
export INGRESS_PATH="${INGRESS_PATH:-}"

bashio::log.info "Starting One-Off Scheduling add-on..."
bashio::log.info "Port: ${PORT}"
bashio::log.info "Home Assistant URL: ${HA_URL}"
bashio::log.info "Ingress Path: ${INGRESS_PATH}"

# Start the application
cd /app || exit 1
exec node server.js
