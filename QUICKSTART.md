# Quick Start Guide - MCP Server

## TL;DR

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your Home Assistant details
# Set HA_URL and HA_TOKEN

# 3. Start everything
./start.sh

# Access:
# - Web UI: http://localhost:3000
# - MCP Server: Port 8000
```

## What You Get

- **11 MCP Tools** for controlling Home Assistant
- **Web Interface** for manual scheduling
- **Docker Deployment** for easy setup
- **Full Documentation** in MCP_README.md

## MCP Tools at a Glance

| Tool | What It Does |
|------|--------------|
| `get_entities` | List all lights, switches, etc. |
| `get_entity_state` | Get current state of any entity |
| `schedule_action` | Schedule future actions |
| `get_scheduled_jobs` | See what's scheduled |
| `cancel_scheduled_job` | Cancel a scheduled action |
| `turn_on_entity` | Turn on light/switch now |
| `turn_off_entity` | Turn off light/switch now |
| `set_climate_temperature` | Set thermostat |
| `set_cover_position` | Control blinds/garage |
| `get_available_services` | List HA services |
| `health_check` | Check if everything works |

## Common Use Cases

### Schedule a Light
```python
schedule_action(
    entity_id="light.bedroom",
    service="turn_on",
    schedule_type="relative",
    schedule_value="30",  # 30 minutes from now
    service_data={"brightness": 200}
)
```

### Turn On Immediately
```python
turn_on_entity(
    entity_id="light.living_room",
    brightness=255
)
```

### List All Lights
```python
get_entities(domain="light")
```

### Set Thermostat
```python
set_climate_temperature(
    entity_id="climate.living_room",
    temperature=22,
    hvac_mode="heat"
)
```

## Deployment Options

### Option 1: Docker Compose (Easiest)
```bash
./start.sh
```

### Option 2: Individual Containers
```bash
# Web only
docker build -t ha-web . && docker run -p 3000:3000 ha-web

# MCP only
docker build -f Dockerfile.mcp -t ha-mcp . && docker run -p 8000:8000 ha-mcp
```

### Option 3: Combined Container
```bash
docker build -f Dockerfile.combined -t ha-combined . && \
docker run -p 3000:3000 -p 8000:8000 ha-combined
```

## Configuration

Required environment variables:

```env
HA_URL=http://your-homeassistant:8123
HA_TOKEN=your_long_lived_token
```

Get your token:
1. Home Assistant → Profile
2. Scroll to "Long-Lived Access Tokens"
3. Click "Create Token"
4. Copy and paste in .env

## Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ha-scheduling": {
      "command": "python",
      "args": ["/full/path/to/mcp_server.py"],
      "env": {
        "HA_URL": "http://192.168.1.100:8123",
        "HA_TOKEN": "your_token",
        "NODE_SERVER_URL": "http://localhost:3000"
      }
    }
  }
}
```

Config file location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Troubleshooting

### Can't Connect to Home Assistant

```bash
# Test from your machine
curl http://your-ha-ip:8123/api/

# Should return: "API running."
```

### Services Won't Start

```bash
# Check logs
docker compose logs

# Verify .env file
cat .env
```

### MCP Not Working in Claude

1. Check MCP server is running:
```bash
docker compose ps
```

2. Restart Claude Desktop completely

3. Check Claude Desktop logs for errors

## Need Help?

- Full docs: [MCP_README.md](MCP_README.md)
- Docker guide: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- Implementation details: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## Testing

Run tests:
```bash
# Install Python deps
pip install -r requirements.txt

# Run integration tests
python test_mcp_integration.py

# Test Docker builds
docker compose build
```

## Security Notes

⚠️ **Important:**
- Never commit `.env` with real tokens
- Use HTTPS in production
- Keep tokens secure
- Use firewall rules to limit access

## What's Next?

After setup:
1. ✅ Test web interface at http://localhost:3000
2. ✅ Configure Claude Desktop with MCP server
3. ✅ Try scheduling some lights
4. ✅ Read full docs for advanced features

---

**Quick Links:**
- [Full README](README.md)
- [MCP Documentation](MCP_README.md)
- [Docker Guide](DOCKER_DEPLOYMENT.md)
- [GitHub Repo](https://github.com/josemzr/ha-one-off-scheduling)
