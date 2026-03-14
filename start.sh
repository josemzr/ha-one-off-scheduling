#!/bin/bash
# Quick start script for running the entire system with Docker Compose

set -e

echo "=== Home Assistant One-Off Scheduling - Docker Deployment ==="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  Please edit .env file with your Home Assistant configuration:"
    echo "  - HA_URL: Your Home Assistant URL"
    echo "  - HA_TOKEN: Your Home Assistant access token"
    echo ""
    echo "After editing .env, run this script again."
    exit 1
fi

# Source environment variables
set -a
source .env
set +a

# Check if required variables are set
if [ -z "$HA_URL" ] || [ "$HA_TOKEN" = "your_long_lived_access_token_here" ]; then
    echo "⚠️  Please configure your .env file with valid Home Assistant credentials"
    exit 1
fi

echo "Configuration:"
echo "  HA_URL: $HA_URL"
echo "  HA_TOKEN: ${HA_TOKEN:0:10}..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ docker-compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "Starting services with Docker Compose..."
echo ""

# Build and start services
$COMPOSE_CMD up --build -d

echo ""
echo "✓ Services started successfully!"
echo ""
echo "Access the application:"
echo "  Web Interface: http://localhost:3000"
echo "  MCP Server: Port 8000"
echo ""
echo "View logs:"
echo "  $COMPOSE_CMD logs -f"
echo ""
echo "Stop services:"
echo "  $COMPOSE_CMD down"
