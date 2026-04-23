/**
 * Authenticated REST API for Home Assistant One-Off Scheduling
 *
 * Mirrors the MCP server tools as standard REST endpoints under /api/v1/.
 * Protected by the same Bearer token (MCP_AUTH_TOKEN) used for MCP access.
 */

const crypto = require('crypto');
const express = require('express');

// Bearer token (shared with MCP server)
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || '';

/**
 * Bearer token authentication middleware.
 * Uses constant-time comparison to prevent timing attacks.
 */
function authMiddleware(req, res, next) {
  if (!MCP_AUTH_TOKEN) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  // HMAC both values so timingSafeEqual always compares equal-length buffers,
  // avoiding timing leaks from a length mismatch.
  const expectedHash = crypto.createHmac('sha256', MCP_AUTH_TOKEN).update('auth').digest();
  const tokenHash = crypto.createHmac('sha256', token).update('auth').digest();
  if (!crypto.timingSafeEqual(expectedHash, tokenHash)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
}

/**
 * Mount the authenticated REST API on an Express app.
 * @param {import('express').Express} app - The Express app
 * @param {object} core - Core functions from server.js
 */
function mountRestApi(app, core) {
  const router = express.Router();

  // Apply auth to all /api/v1 routes
  router.use(authMiddleware);

  // GET /api/v1/entities  — get_entities
  router.get('/entities', async (req, res) => {
    try {
      const states = await core.callHomeAssistant('states');
      let entities = states.filter(e => {
        const domain = e.entity_id.split('.')[0];
        return ['light', 'switch', 'climate', 'lock', 'cover', 'fan'].includes(domain);
      });
      if (req.query.entity_type) {
        entities = entities.filter(e => e.entity_id.startsWith(`${req.query.entity_type}.`));
      }
      res.json(entities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entities', details: error.message });
    }
  });

  // GET /api/v1/services  — get_services
  router.get('/services', async (req, res) => {
    try {
      const services = await core.callHomeAssistant('services');
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch services', details: error.message });
    }
  });

  // GET /api/v1/entities/:entityId/state  — get_entity_state
  router.get('/entities/:entityId/state', async (req, res) => {
    try {
      const states = await core.callHomeAssistant('states');
      const entity = states.find(e => e.entity_id === req.params.entityId);
      if (!entity) {
        return res.status(404).json({ error: `Entity ${req.params.entityId} not found` });
      }
      res.json(entity);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entity state', details: error.message });
    }
  });

  // POST /api/v1/schedule  — schedule_action
  router.post('/schedule', async (req, res) => {
    try {
      const { entity_id, service, schedule_type, schedule_value, service_data } = req.body;
      const result = await core.scheduleAction({
        entityId: entity_id,
        service,
        scheduleType: schedule_type,
        scheduleValue: schedule_value,
        serviceData: service_data || {},
      });
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Failed to schedule action' });
    }
  });

  // GET /api/v1/jobs  — get_scheduled_jobs
  router.get('/jobs', (req, res) => {
    res.json(core.getScheduledJobs());
  });

  // DELETE /api/v1/jobs/:jobId  — cancel_scheduled_job
  router.delete('/jobs/:jobId', (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      const result = core.cancelScheduledJob(jobId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Failed to cancel job' });
    }
  });

  // GET /api/v1/health  — check_health
  router.get('/health', async (req, res) => {
    try {
      await core.callHomeAssistant('');
      res.json({ status: 'ok', haConnected: true });
    } catch (error) {
      res.json({ status: 'error', haConnected: false, error: error.message });
    }
  });

  app.use('/api/v1', router);

  console.log('REST API mounted at /api/v1');
  if (MCP_AUTH_TOKEN) {
    console.log('REST API authentication: enabled (Bearer token required)');
  } else {
    console.log('REST API authentication: DISABLED (set MCP_AUTH_TOKEN to secure)');
  }
}

module.exports = { mountRestApi };
