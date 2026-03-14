#!/bin/bash
# Test script to verify MCP server installation and basic functionality

set -e

echo "=== Testing MCP Server Setup ==="

# Check if Python is installed
echo "Checking Python installation..."
python3 --version

# Check if pip is installed
echo "Checking pip installation..."
pip3 --version

# Install dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Validate Python syntax
echo "Validating Python syntax..."
python3 -m py_compile mcp_server.py

echo "✓ All checks passed!"
echo ""
echo "To run the MCP server, ensure you have set the following environment variables:"
echo "  - HA_URL: Your Home Assistant URL"
echo "  - HA_TOKEN: Your Home Assistant access token"
echo "  - NODE_SERVER_URL: URL of the Node.js server (default: http://localhost:3000)"
echo ""
echo "Then run: python3 mcp_server.py"
