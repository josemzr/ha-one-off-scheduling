/**
 * MCP Server for Home Assistant One-Off Scheduling
 *
 * Registers MCP tools using @modelcontextprotocol/sdk that directly call
 * the same core functions as the REST API. Mounted on the main Express app.
 */

const crypto = require('crypto');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod/v3');

// Bearer token for MCP authentication
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || '';

if (!MCP_AUTH_TOKEN) {
  console.warn('⚠️  MCP_AUTH_TOKEN not set — MCP endpoint is unauthenticated!');
}

/**
 * Creates the McpServer with all tools registered.
 * @param {object} core - Core functions from server.js
 */
function createMcpServer(core) {
  const server = new McpServer({
    name: 'ha-one-off-scheduling',
    version: '1.0.0',
  });

  // -- Tools --

  server.tool(
    'get_entities',
    'Get all actionable Home Assistant entities, optionally filtered by type (light, switch, climate, lock, cover, fan)',
    { entity_type: z.string().optional().describe('Filter by entity type, e.g. "light", "switch", "climate"') },
    async ({ entity_type }) => {
      const states = await core.callHomeAssistant('states');
      let entities = states.filter(e => {
        const domain = e.entity_id.split('.')[0];
        return ['light', 'switch', 'climate', 'lock', 'cover', 'fan'].includes(domain);
      });
      if (entity_type) {
        entities = entities.filter(e => e.entity_id.startsWith(`${entity_type}.`));
      }
      return { content: [{ type: 'text', text: JSON.stringify(entities, null, 2) }] };
    }
  );

  server.tool(
    'get_services',
    'Get all available Home Assistant services',
    async () => {
      const services = await core.callHomeAssistant('services');
      return { content: [{ type: 'text', text: JSON.stringify(services, null, 2) }] };
    }
  );

  server.tool(
    'schedule_action',
    'Schedule a one-off action for a Home Assistant entity. Use schedule_type "immediate" for instant execution, "relative" for seconds from now, or "absolute" for a specific time. For climate entities, use service "restore_state" with service_data containing the state to restore (hvac_mode, temperature, fan_mode).',
    {
      entity_id: z.string().describe('Entity ID, e.g. "light.living_room"'),
      service: z.string().describe('Service to call, e.g. "turn_on", "turn_off", or "restore_state" for climate entities'),
      schedule_type: z.enum(['immediate', 'relative', 'absolute']).describe('"immediate" (execute now), "relative" (seconds from now), or "absolute" (ISO datetime)'),
      schedule_value: z.string().optional().describe('Seconds from now (e.g. "30") or ISO datetime (e.g. "2026-03-15T14:30:00"). Not required for "immediate" type.'),
      service_data: z.record(z.any()).optional().describe('Optional service parameters, e.g. {"brightness": 255}. For restore_state: {"hvac_mode": "heat", "temperature": 21, "fan_mode": "auto"}'),
    },
    async ({ entity_id, service, schedule_type, schedule_value, service_data }) => {
      const result = await core.scheduleAction({
        entityId: entity_id,
        service,
        scheduleType: schedule_type,
        scheduleValue: schedule_value,
        serviceData: service_data || {},
      });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'get_scheduled_jobs',
    'Get all currently scheduled jobs',
    async () => {
      const jobs = core.getScheduledJobs();
      return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] };
    }
  );

  server.tool(
    'cancel_scheduled_job',
    'Cancel a scheduled job by its ID',
    { job_id: z.number().describe('The job ID to cancel') },
    async ({ job_id }) => {
      const result = core.cancelScheduledJob(job_id);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'check_health',
    'Check the health of the server and Home Assistant connection',
    async () => {
      try {
        await core.callHomeAssistant('');
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'ok', haConnected: true }) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'error', haConnected: false, error: error.message }) }] };
      }
    }
  );

  server.tool(
    'get_entity_state',
    'Get the current state of a specific entity',
    { entity_id: z.string().describe('Entity ID, e.g. "light.living_room"') },
    async ({ entity_id }) => {
      const states = await core.callHomeAssistant('states');
      const entity = states.find(e => e.entity_id === entity_id);
      if (!entity) {
        return { content: [{ type: 'text', text: `Entity ${entity_id} not found` }], isError: true };
      }
      return { content: [{ type: 'text', text: JSON.stringify(entity, null, 2) }] };
    }
  );

  return server;
}

/**
 * Bearer token authentication middleware for the /mcp route.
 */
function mcpAuthMiddleware(req, res, next) {
  if (!MCP_AUTH_TOKEN) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  // Constant-time comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(MCP_AUTH_TOKEN);
  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
}

// Track transports by session ID for session management
const transports = {};

/**
 * Mount MCP Streamable HTTP endpoint on an Express app.
 * @param {import('express').Express} app - The Express app
 * @param {object} core - Core functions from server.js
 */
function mountMcp(app, core) {
  // Handle POST requests for client-to-server communication
  app.post('/mcp', mcpAuthMiddleware, async (req, res) => {
    try {
      // Check for existing session
      const sessionId = req.headers['mcp-session-id'];
      let transport;

      // Check if this is an initialize request (new session or reconnect)
      const isInitialize = req.body?.method === 'initialize' ||
        (Array.isArray(req.body) && req.body.some(m => m.method === 'initialize'));

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId || isInitialize) {
        // New session or re-initialize after server restart
        // Pre-generate sessionId and register BEFORE handleRequest to avoid
        // race condition: client receives initialize response with session ID,
        // immediately opens GET SSE, but transport isn't registered yet.
        const newSessionId = crypto.randomUUID();
        const mcpServer = createMcpServer(core);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
        });

        // Register transport BEFORE handling the request so the GET SSE
        // stream can find it as soon as the client receives the session ID
        transports[newSessionId] = transport;

        transport.onclose = () => {
          delete transports[newSessionId];
        };

        await mcpServer.connect(transport);
      } else {
        // Invalid session ID for non-initialize request
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Handle GET requests for server-to-client notifications (SSE stream)
  app.get('/mcp', mcpAuthMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  // Handle DELETE requests for session termination
  app.delete('/mcp', mcpAuthMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    await transports[sessionId].close();
    delete transports[sessionId];
    res.status(200).end();
  });

  console.log('MCP server mounted at /mcp (Streamable HTTP)');
  if (MCP_AUTH_TOKEN) {
    console.log('MCP authentication: enabled (Bearer token required)');
  } else {
    console.log('MCP authentication: DISABLED (set MCP_AUTH_TOKEN to secure)');
  }
}

module.exports = { mountMcp };
