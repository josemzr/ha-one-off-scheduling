# Home Assistant One-Off Scheduling

A responsive web application for scheduling one-off automations in Home Assistant. This application allows you to easily schedule future actions for your Home Assistant entities without creating complex automations.

## Features

- 🏠 **Entity Management**: View and filter all actionable entities (lights, switches, climate, locks, covers, fans)
- ⏰ **Flexible Scheduling**: Schedule actions using relative time (e.g., "in 20 minutes") or absolute time (e.g., "at 14:30")
- 🎛️ **Entity-Specific Parameters**: Configure appropriate parameters for different entity types:
  - Lights: brightness, color temperature
  - Climate: temperature, HVAC mode
  - Covers: position
  - Fans: speed percentage
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 📋 **Job Management**: View and cancel scheduled actions
- 🔄 **Real-time Updates**: Auto-refresh scheduled jobs list
- 🤖 **MCP Server**: Integrated Model Context Protocol server for programmatic access via MCP clients

## Home Assistant Add-on

This project is available as a Home Assistant add-on, making it easy to integrate with your smart home setup. The add-on:

- Automatically connects to your Home Assistant instance (no token configuration needed)
- Runs as a native add-on in the Supervisor
- Supports all architectures (amd64, aarch64, armv7, armhf, i386)
- Provides a web UI accessible through Home Assistant
- Auto-starts with Home Assistant (optional)

See the [Installation](#installation) section below for setup instructions.

## Prerequisites (Standalone Installation Only)

- Node.js (v14 or higher)
- Home Assistant instance with API access
- Long-lived access token from Home Assistant

## Installation

### Option 1: Home Assistant Add-on (Recommended)

The easiest way to use this application is as a Home Assistant add-on:

1. Navigate to **Settings** → **Add-ons** → **Add-on Store** in your Home Assistant instance
2. Click the menu icon (⋮) in the top right and select **Repositories**
3. Add this repository URL: `https://github.com/jmm-org1/ha-one-off-scheduling`
4. Click **Add**
5. Find "One-Off Scheduling" in the list of add-ons
6. Click on it and then click **Install**
7. Once installed, click **Start**
8. (Optional) Enable **Start on boot** and **Watchdog** for automatic startup
9. Click **Open Web UI** to access the application

The add-on automatically connects to your Home Assistant instance - no configuration needed!

#### Add-on MCP Configuration (Optional)

The add-on exposes port **3000** directly (bypassing ingress) so MCP clients can connect. To enable MCP authentication:

1. Go to the add-on **Configuration** tab
2. Set `mcp_auth_token` to a secure random string
3. Save and restart the add-on

Then point your MCP client to `http://<your-ha-ip>:3000/mcp` with the token as a Bearer header. See the [MCP Server](#mcp-server-model-context-protocol) section for full details.

### Option 2: Standalone Installation

If you prefer to run the application outside of Home Assistant:

1. Clone the repository:
```bash
git clone https://github.com/jmm-org1/ha-one-off-scheduling.git
cd ha-one-off-scheduling
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and configure your Home Assistant connection:
```env
HA_URL=http://your-homeassistant-ip:8123
HA_TOKEN=your_long_lived_access_token_here
PORT=3000
```

#### Getting a Home Assistant Long-Lived Access Token

1. Log in to your Home Assistant instance
2. Click on your username in the bottom left corner
3. Scroll down to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Give it a name (e.g., "Scheduler App")
6. Copy the token and paste it in your `.env` file

## MCP Server (Model Context Protocol)

The MCP server is integrated directly into the Express application using **Streamable HTTP** transport — no separate process or Python runtime needed. It starts automatically when you run `npm start`.

### MCP Server Features

- **Integrated**: Runs on the same port as the web UI (no separate service)
- **Streamable HTTP**: Modern MCP transport (replaces deprecated SSE)
- **Bearer Token Auth**: Protects the `/mcp` endpoint with token authentication
- **Tool-based Interface**: All scheduling functions exposed as MCP tools
- **Session Management**: Stateful sessions with automatic cleanup

### Connecting MCP Clients

The MCP endpoint is available at:
```
http://your-server-ip:3000/mcp
```

**VS Code / Copilot configuration (`.vscode/mcp.json`):**
```json
{
  "servers": {
    "ha-scheduling": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer ${input:mcpToken}"
      }
    }
  },
  "inputs": [
    {
      "id": "mcpToken",
      "type": "promptString",
      "description": "MCP Auth Token",
      "password": true
    }
  ]
}
```

Set the `MCP_AUTH_TOKEN` environment variable to enable authentication. If unset, the endpoint is open (not recommended for production).

### Available MCP Tools

- `get_entities` - List all actionable entities
- `get_services` - Get available Home Assistant services
- `schedule_action` - Schedule a one-off action
- `get_scheduled_jobs` - View scheduled jobs
- `cancel_scheduled_job` - Cancel a scheduled job
- `check_health` - Check server health
- `get_entity_state` - Get current state of an entity

For detailed MCP server documentation, see [MCP_SERVER.md](MCP_SERVER.md).

## REST API

The add-on also exposes an authenticated REST API at `/api/v1/` that mirrors the MCP tools. This provides a stable HTTP endpoint that can be accessed from outside Home Assistant (e.g., from scripts, other services, or automation platforms).

### Authentication

The REST API uses the **same Bearer token** as the MCP server (`mcp_auth_token` in the add-on configuration / `MCP_AUTH_TOKEN` environment variable). Include it in the `Authorization` header:

```
Authorization: Bearer <your-mcp-auth-token>
```

If no token is configured, the API is unauthenticated (not recommended for production).

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/entities` | Get all actionable entities. Optional query param `?entity_type=light` to filter. |
| `GET` | `/api/v1/services` | Get all available Home Assistant services. |
| `GET` | `/api/v1/entities/:entityId/state` | Get the current state of a specific entity. |
| `POST` | `/api/v1/schedule` | Schedule a one-off action. |
| `GET` | `/api/v1/jobs` | Get all currently scheduled jobs. |
| `DELETE` | `/api/v1/jobs/:jobId` | Cancel a scheduled job. |
| `GET` | `/api/v1/health` | Check server and Home Assistant connectivity. |

### Examples

**Get all light entities:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://<your-ha-ip>:3000/api/v1/entities?entity_type=light
```

**Schedule an action (turn on a light in 60 seconds):**
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "light.living_room",
    "service": "turn_on",
    "schedule_type": "relative",
    "schedule_value": "60",
    "service_data": {"brightness": 255}
  }' \
  http://<your-ha-ip>:3000/api/v1/schedule
```

**Get scheduled jobs:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://<your-ha-ip>:3000/api/v1/jobs
```

**Cancel a job:**
```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  http://<your-ha-ip>:3000/api/v1/jobs/1
```

## OpenClaw Skill

An [OpenClaw](https://docs.openclaw.ai) skill is included in the `openclaw-skill/` directory. It allows an OpenClaw agent to interact with all REST API endpoints using natural language.

### Installation

1. Copy (or symlink) the `openclaw-skill/` folder into your OpenClaw workspace skills directory:
   ```bash
   cp -r openclaw-skill ~/.openclaw/workspace/skills/ha-one-off-scheduling
   ```
2. Set the required environment variables:
   ```bash
   export HA_SCHEDULING_URL=http://<your-ha-ip>:3000
   export HA_SCHEDULING_TOKEN=<your-mcp-auth-token>
   ```
3. Restart the OpenClaw gateway or start a new agent session to load the skill.

### What it can do

The skill exposes all REST API capabilities to the agent:

- Check server and Home Assistant connectivity
- List and filter actionable entities (lights, switches, climate, locks, covers, fans)
- Get the current state of any entity
- List available Home Assistant services
- Schedule immediate, relative, or absolute one-off actions
- List pending scheduled jobs
- Cancel scheduled jobs

See [`openclaw-skill/SKILL.md`](openclaw-skill/SKILL.md) for the full skill definition and agent instructions.

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. The application will automatically connect to your Home Assistant instance

### Scheduling an Action

1. **Select an Entity**: Browse or search for the entity you want to control
2. **Choose an Action**: Select the action to perform (turn on, turn off, set temperature, etc.)
3. **Configure Parameters** (if applicable): Set entity-specific parameters like brightness or temperature
4. **Set Schedule Time**: Choose either:
   - **Relative**: Number of minutes from now (e.g., 20 for "in 20 minutes")
   - **Absolute**: Specific date and time
5. **Click "Schedule Action"**: The action will be scheduled and appear in the "Scheduled Actions" list

### Managing Scheduled Actions

- View all scheduled actions in the "Scheduled Actions" section
- Cancel any scheduled action by clicking the "Cancel" button
- Scheduled actions are automatically executed at the specified time

## Supported Entity Types

- **Lights** (`light.*`): Turn on/off with brightness and color control
- **Switches** (`switch.*`): Turn on/off
- **Climate** (`climate.*`): Set temperature and HVAC mode
- **Locks** (`lock.*`): Lock/unlock
- **Covers** (`cover.*`): Open/close/set position
- **Fans** (`fan.*`): Turn on/off with speed control

## Development

The application consists of:
- `server.js`: Express server with Home Assistant API integration and job scheduling
- `mcp-server.js`: Integrated MCP server (Streamable HTTP transport, bearer auth)
- `rest-api.js`: Authenticated REST API mirroring MCP tools at `/api/v1/`
- `public/index.html`: Main application interface
- `public/styles.css`: Responsive styling
- `public/app.js`: Frontend JavaScript for UI interactions

## Security Notes

- Never commit your `.env` file with sensitive tokens
- Use HTTPS in production environments
- Keep your Home Assistant token secure
- Consider using reverse proxy with authentication for production deployments

## Troubleshooting

**Connection Issues:**
- Verify `HA_URL` is correct in `.env`
- Ensure the token has not expired
- Check that Home Assistant is accessible from the server

**Entities Not Showing:**
- Verify the token has proper permissions
- Check Home Assistant logs for API errors
- Ensure entities are not hidden in Home Assistant

**Scheduled Actions Not Executing:**
- Check server logs for errors
- Verify the server is running continuously
- Ensure system time is correct

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
