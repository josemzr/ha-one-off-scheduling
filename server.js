const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');
const path = require('path');
const { mountMcp } = require('./mcp-server');

// Only load .env for local development (not in addon mode)
if (!process.env.SUPERVISOR_TOKEN) {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Get ingress path from environment (set by Home Assistant)
const INGRESS_PATH = process.env.INGRESS_PATH || '';

// Middleware
app.use(express.json());

// Create a router for all routes
const router = express.Router();

// Disable caching for API responses
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// API endpoint to get configuration (including ingress path)
router.get('/api/config', (req, res) => {
  res.json({
    ingressPath: ''
  });
});

// Home Assistant Configuration
const HA_URL = process.env.HA_URL || 'http://homeassistant.local:8123';
// Use SUPERVISOR_TOKEN when running as addon, otherwise use HA_TOKEN
const HA_TOKEN = process.env.SUPERVISOR_TOKEN || process.env.HA_TOKEN || '';

// Store scheduled jobs
const scheduledJobs = new Map();
let jobCounter = 0;

// Helper function to make HA API requests
async function callHomeAssistant(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${HA_URL}/api/${endpoint}`,
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    console.log(`HA API Call: ${method} ${config.url}`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('HA API Error:', error.response?.status, error.response?.statusText, error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Execute a Home Assistant action (used for immediate and scheduled execution)
async function executeAction(entityId, service, serviceData) {
  const domain = entityId.split('.')[0];

  if (service === 'restore_state') {
    // Restore climate entity state with multiple service calls
    if (serviceData.hvac_mode) {
      await callHomeAssistant(`services/${domain}/set_hvac_mode`, 'POST', {
        entity_id: entityId,
        hvac_mode: serviceData.hvac_mode,
      });
    }
    if (serviceData.temperature != null) {
      await callHomeAssistant(`services/${domain}/set_temperature`, 'POST', {
        entity_id: entityId,
        temperature: serviceData.temperature,
      });
    }
    if (serviceData.fan_mode) {
      await callHomeAssistant(`services/${domain}/set_fan_mode`, 'POST', {
        entity_id: entityId,
        fan_mode: serviceData.fan_mode,
      });
    }
  } else {
    await callHomeAssistant(`services/${domain}/${service}`, 'POST', {
      entity_id: entityId,
      ...serviceData,
    });
  }
}

// Core scheduling function (shared between REST API and MCP tools)
async function scheduleAction({ entityId, service, serviceData, scheduleType, scheduleValue }) {
  if (!entityId || !service) {
    throw Object.assign(new Error('Missing required fields'), { statusCode: 400 });
  }

  // Handle immediate execution
  if (scheduleType === 'immediate') {
    try {
      await executeAction(entityId, service, serviceData || {});
      console.log(`Executed immediate action: ${service} on ${entityId}`);
      return { success: true, immediate: true };
    } catch (error) {
      console.error(`Failed to execute immediate action: ${error.message}`);
      throw Object.assign(new Error(`Failed to execute action: ${error.message}`), { statusCode: 500 });
    }
  }

  let scheduleDate;
  if (scheduleType === 'relative') {
    const seconds = parseInt(scheduleValue);
    if (isNaN(seconds) || seconds < 1) {
      throw Object.assign(new Error('Schedule value must be at least 1 second'), { statusCode: 400 });
    }
    scheduleDate = new Date(Date.now() + seconds * 1000);
  } else if (scheduleType === 'absolute') {
    scheduleDate = new Date(scheduleValue);
  } else {
    throw Object.assign(new Error('Invalid schedule type'), { statusCode: 400 });
  }

  if (scheduleDate <= new Date()) {
    throw Object.assign(new Error('Schedule time must be in the future'), { statusCode: 400 });
  }

  const jobId = ++jobCounter;

  const job = schedule.scheduleJob(scheduleDate, async () => {
    try {
      await executeAction(entityId, service, serviceData || {});
      console.log(`Executed scheduled action: ${service} on ${entityId}`);
      scheduledJobs.delete(jobId);
    } catch (error) {
      console.error(`Failed to execute scheduled action: ${error.message}`);
      scheduledJobs.delete(jobId);
    }
  });

  scheduledJobs.set(jobId, { id: jobId, entityId, service, serviceData, scheduleDate: scheduleDate.toISOString(), job });

  return { success: true, jobId, scheduleDate: scheduleDate.toISOString() };
}

function getScheduledJobs() {
  return Array.from(scheduledJobs.values()).map(({ job, ...rest }) => rest);
}

function cancelScheduledJob(jobId) {
  const scheduledJob = scheduledJobs.get(jobId);
  if (!scheduledJob) {
    throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  }
  scheduledJob.job.cancel();
  scheduledJobs.delete(jobId);
  return { success: true };
}

// API Routes

// Get all entities
router.get('/api/entities', async (req, res) => {
  try {
    const states = await callHomeAssistant('states');
    
    // Filter for actionable entities
    const actionableEntities = states.filter(entity => {
      const domain = entity.entity_id.split('.')[0];
      return ['light', 'switch', 'climate', 'lock', 'cover', 'fan'].includes(domain);
    });
    
    res.json(actionableEntities);
  } catch (error) {
    console.error('Failed to fetch entities:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch entities',
      details: error.message,
      haUrl: HA_URL,
      hasToken: !!HA_TOKEN
    });
  }
});

// Get entity services
router.get('/api/services', async (req, res) => {
  try {
    const services = await callHomeAssistant('services');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get entity state
router.get('/api/entity/:entityId/state', async (req, res) => {
  try {
    const state = await callHomeAssistant(`states/${req.params.entityId}`);
    res.json(state);
  } catch (error) {
    console.error('Failed to fetch entity state:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch entity state' });
  }
});

// Schedule an action
router.post('/api/schedule', async (req, res) => {
  try {
    const result = await scheduleAction(req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to schedule action' });
  }
});

// Get scheduled jobs
router.get('/api/scheduled', (req, res) => {
  res.json(getScheduledJobs());
});

// Cancel a scheduled job
router.delete('/api/schedule/:jobId', (req, res) => {
  try {
    const result = cancelScheduledJob(parseInt(req.params.jobId));
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to cancel job' });
  }
});

// Health check
router.get('/api/health', async (req, res) => {
  try {
    await callHomeAssistant('');
    res.json({ status: 'ok', haConnected: true });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.json({ 
      status: 'error', 
      haConnected: false, 
      error: error.message,
      haUrl: HA_URL,
      hasToken: !!HA_TOKEN
    });
  }
});

// Serve static files AFTER API routes
router.use(express.static('public', {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));

// Serve main page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mount the router - always at root since HA ingress strips the prefix
app.use('/', router);

// Mount MCP server (Streamable HTTP) at /mcp
mountMcp(app, { callHomeAssistant, scheduleAction, getScheduledJobs, cancelScheduledJob });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Home Assistant URL: ${HA_URL}`);
  console.log(`Ingress Path: ${INGRESS_PATH || 'Not set (direct access)'}`);
  console.log(`Has HA Token: ${HA_TOKEN ? 'Yes (length: ' + HA_TOKEN.length + ')' : 'No'}`);
  console.log(`Supervisor Token: ${process.env.SUPERVISOR_TOKEN ? 'Available (length: ' + process.env.SUPERVISOR_TOKEN.length + ')' : 'Not available'}`);
  console.log(`Using token from: ${process.env.SUPERVISOR_TOKEN ? 'SUPERVISOR_TOKEN' : (process.env.HA_TOKEN ? 'HA_TOKEN env' : 'dotenv')}`);
});
