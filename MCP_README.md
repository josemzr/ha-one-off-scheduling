# MCP Server for Home Assistant One-Off Scheduling

This directory contains the Model Context Protocol (MCP) server implementation for the Home Assistant One-Off Scheduling application.

## Overview

The MCP server provides a standardized interface to interact with the Home Assistant scheduling system. It exposes various tools that can be called from MCP clients to manage entities and schedule automations.

## Available MCP Tools

### Entity Management

1. **get_entities(domain: Optional[str])**: Get all actionable entities from Home Assistant
   - Optional domain filter: light, switch, climate, lock, cover, fan
   - Returns list of entity objects with current states

2. **get_entity_state(entity_id: str)**: Get current state and attributes of a specific entity
   - Returns detailed state information for the specified entity

3. **get_available_services(domain: Optional[str])**: Get available Home Assistant services
   - Optional domain filter
   - Returns dictionary of services organized by domain

### Scheduling Operations

4. **schedule_action(...)**: Schedule a one-off action for a Home Assistant entity
   - Parameters:
     - `entity_id`: Entity to control (e.g., 'light.living_room')
     - `service`: Service to call (e.g., 'turn_on', 'turn_off')
     - `schedule_type`: 'relative' (minutes from now) or 'absolute' (specific datetime)
     - `schedule_value`: Minutes or ISO datetime string
     - `service_data`: Optional service-specific parameters
   - Returns job ID and scheduled datetime

5. **get_scheduled_jobs()**: Get all currently scheduled jobs
   - Returns list of scheduled job objects

6. **cancel_scheduled_job(job_id: int)**: Cancel a scheduled job
   - Returns success response

### Direct Control Operations

7. **turn_on_entity(...)**: Turn on an entity immediately
   - Supports brightness, color_temp, and rgb_color for lights

8. **turn_off_entity(entity_id: str)**: Turn off an entity immediately

9. **set_climate_temperature(...)**: Set climate entity temperature
   - Supports temperature and hvac_mode parameters

10. **set_cover_position(entity_id: str, position: int)**: Set cover position

### System Operations

11. **health_check()**: Check service health and Home Assistant connection

## Running the MCP Server

### Option 1: Docker Compose (Recommended)

Run both the Node.js server and MCP server together:

```bash
docker-compose up
```

The MCP server will be available on port 8000, and the web interface on port 3000.

### Option 2: Combined Docker Image

Build and run a single container with both services:

```bash
docker build -f Dockerfile.combined -t ha-scheduling-combined .
docker run -p 3000:3000 -p 8000:8000 \
  -e HA_URL=http://your-ha-ip:8123 \
  -e HA_TOKEN=your_token \
  ha-scheduling-combined
```

### Option 3: Standalone Python

Run just the MCP server:

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export HA_URL=http://your-ha-ip:8123
export HA_TOKEN=your_token
export NODE_SERVER_URL=http://localhost:3000

# Run the server
python mcp_server.py
```

## Configuration

Set these environment variables:

- `HA_URL`: Home Assistant instance URL (default: http://homeassistant.local:8123)
- `HA_TOKEN`: Home Assistant long-lived access token
- `SUPERVISOR_TOKEN`: Home Assistant supervisor token (for add-on mode)
- `NODE_SERVER_URL`: URL of the Node.js scheduling server (default: http://localhost:3000)

## Usage Examples

### Using with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "ha-scheduling": {
      "command": "python",
      "args": ["/path/to/mcp_server.py"],
      "env": {
        "HA_URL": "http://your-ha-ip:8123",
        "HA_TOKEN": "your_token",
        "NODE_SERVER_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Example Tool Calls

Schedule a light to turn on in 30 minutes:
```python
schedule_action(
  entity_id="light.living_room",
  service="turn_on",
  schedule_type="relative",
  schedule_value="30",
  service_data={"brightness": 200}
)
```

Get all light entities:
```python
get_entities(domain="light")
```

Check scheduled jobs:
```python
get_scheduled_jobs()
```

## Architecture

The MCP server acts as a bridge between MCP clients and the Home Assistant scheduling system:

```
MCP Client (e.g., Claude Desktop)
    ↓
MCP Server (Python/FastMCP) - Port 8000
    ↓
Node.js Scheduling Server - Port 3000
    ↓
Home Assistant API
```

## Development

The MCP server is built using:
- **FastMCP**: Python framework for building MCP servers
- **httpx**: Async HTTP client for API calls
- **Python 3.11+**: Modern Python features

## Security

- Never commit `.env` files with tokens
- Use HTTPS in production
- Secure your Home Assistant API token
- Use network isolation when possible
