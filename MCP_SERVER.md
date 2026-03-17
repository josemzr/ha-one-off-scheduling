# MCP Server for Home Assistant One-Off Scheduling

This document describes the Model Context Protocol (MCP) server implementation for the Home Assistant One-Off Scheduling application.

## Overview

The MCP server is built into the main Node.js application and served on the same port. It uses the **Streamable HTTP** transport (the current MCP standard) via the official `@modelcontextprotocol/sdk`.

## Architecture

```
MCP Client → POST /mcp (Streamable HTTP) → Express (server.js) → Home Assistant API
                                              ↑
Web UI   → REST API (/api/*)  ────────────────┘
```

The MCP tools and the REST API share the same core functions — there is no inter-process communication or separate server.

## Configuration

Add `MCP_AUTH_TOKEN` to your `.env` file:

```bash
# Required: token that MCP clients must send as a Bearer token
MCP_AUTH_TOKEN=your_secret_token_here
```

The MCP endpoint is automatically available at `http://<host>:<PORT>/mcp` when the server starts.

## Connecting MCP Clients

### VS Code (`mcp.json`)

```json
{
  "servers": {
    "ha-scheduling": {
      "url": "http://localhost:3000/mcp",
      "type": "http",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_AUTH_TOKEN"
      }
    }
  }
}
```

## Authentication

All requests to `/mcp` require a `Authorization: Bearer <token>` header. The token is compared in constant time to prevent timing attacks.

If `MCP_AUTH_TOKEN` is not set, the endpoint is unauthenticated (a warning is printed at startup).

## Available MCP Tools

### 1. `get_entities`

Get all actionable entities from Home Assistant.

**Parameters:**
- `entity_type` (optional): Filter by entity type (e.g., 'light', 'switch', 'climate', 'lock', 'cover', 'fan')

### 2. `get_services`

Get all available Home Assistant services.

### 3. `schedule_action`

Schedule a one-off action for a Home Assistant entity.

**Parameters:**
- `entity_id` (required): Entity ID to control (e.g., 'light.living_room')
- `service` (required): Service to call (e.g., 'turn_on', 'turn_off')
- `schedule_type` (required): Either 'relative' or 'absolute'
- `schedule_value` (required): Minutes from now (e.g., '20') or ISO datetime (e.g., '2026-03-15T14:30:00')
- `service_data` (optional): Service parameters (e.g., `{"brightness": 255}`)

### 4. `get_scheduled_jobs`

Get all currently scheduled jobs.

### 5. `cancel_scheduled_job`

Cancel a scheduled job by its ID.

**Parameters:**
- `job_id` (required): The ID of the job to cancel

### 6. `check_health`

Check the health of the server and Home Assistant connection.

### 7. `get_entity_state`

Get the current state and attributes of a specific entity.

**Parameters:**
- `entity_id` (required): Entity ID to query (e.g., 'light.living_room')

## Supported Entity Types

| Domain | Actions | Parameters |
|--------|---------|------------|
| `light.*` | `turn_on`, `turn_off` | `brightness`, `color_temp`, `rgb_color` |
| `switch.*` | `turn_on`, `turn_off` | — |
| `climate.*` | `set_temperature`, `set_hvac_mode` | `temperature`, `hvac_mode` |
| `lock.*` | `lock`, `unlock` | — |
| `cover.*` | `open_cover`, `close_cover`, `set_cover_position` | `position` |
| `fan.*` | `turn_on`, `turn_off` | `percentage` |

## Development

### Adding New Tools

Edit `mcp-server.js` and register a new tool inside `createMcpServer()`:

```js
server.tool(
  'my_new_tool',
  'Description of what this tool does',
  { param1: z.string().describe('Parameter description') },
  async ({ param1 }) => {
    const result = await core.callHomeAssistant('some/endpoint');
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);
```

## Security Considerations

- **Never commit `.env` files** with sensitive tokens
- Use environment variables for configuration in production
- Use HTTPS via a reverse proxy in production
- The `MCP_AUTH_TOKEN` is compared using `crypto.timingSafeEqual` to prevent timing attacks

## License

ISC (same as the main project)

## Support

For issues or questions:
- GitHub Issues: https://github.com/jmm-org1/ha-one-off-scheduling/issues
- Repository: https://github.com/jmm-org1/ha-one-off-scheduling
