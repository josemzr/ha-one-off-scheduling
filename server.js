const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');
const path = require('path');

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

// Schedule an action
router.post('/api/schedule', async (req, res) => {
  try {
    const { entityId, service, serviceData, scheduleType, scheduleValue } = req.body;
    
    if (!entityId || !service) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    let scheduleDate;
    
    if (scheduleType === 'relative') {
      // scheduleValue is in minutes
      const minutes = parseInt(scheduleValue);
      scheduleDate = new Date(Date.now() + minutes * 60 * 1000);
    } else if (scheduleType === 'absolute') {
      // scheduleValue is a datetime string
      scheduleDate = new Date(scheduleValue);
    } else {
      return res.status(400).json({ error: 'Invalid schedule type' });
    }
    
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ error: 'Schedule time must be in the future' });
    }
    
    const jobId = ++jobCounter;
    const domain = entityId.split('.')[0];
    
    // Schedule the job
    const job = schedule.scheduleJob(scheduleDate, async () => {
      try {
        await callHomeAssistant(
          `services/${domain}/${service}`,
          'POST',
          {
            entity_id: entityId,
            ...serviceData
          }
        );
        console.log(`Executed scheduled action: ${service} on ${entityId}`);
        scheduledJobs.delete(jobId);
      } catch (error) {
        console.error(`Failed to execute scheduled action: ${error.message}`);
        scheduledJobs.delete(jobId);
      }
    });
    
    scheduledJobs.set(jobId, {
      id: jobId,
      entityId,
      service,
      serviceData,
      scheduleDate: scheduleDate.toISOString(),
      job
    });
    
    res.json({
      success: true,
      jobId,
      scheduleDate: scheduleDate.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule action' });
  }
});

// Get scheduled jobs
router.get('/api/scheduled', (req, res) => {
  const jobs = Array.from(scheduledJobs.values()).map(({ job, ...rest }) => rest);
  res.json(jobs);
});

// Cancel a scheduled job
router.delete('/api/schedule/:jobId', (req, res) => {
  const jobId = parseInt(req.params.jobId);
  const scheduledJob = scheduledJobs.get(jobId);
  
  if (!scheduledJob) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  scheduledJob.job.cancel();
  scheduledJobs.delete(jobId);
  
  res.json({ success: true });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Home Assistant URL: ${HA_URL}`);
  console.log(`Ingress Path: ${INGRESS_PATH || 'Not set (direct access)'}`);
  console.log(`Has HA Token: ${HA_TOKEN ? 'Yes (length: ' + HA_TOKEN.length + ')' : 'No'}`);
  console.log(`Supervisor Token: ${process.env.SUPERVISOR_TOKEN ? 'Available (length: ' + process.env.SUPERVISOR_TOKEN.length + ')' : 'Not available'}`);
  console.log(`Using token from: ${process.env.SUPERVISOR_TOKEN ? 'SUPERVISOR_TOKEN' : (process.env.HA_TOKEN ? 'HA_TOKEN env' : 'dotenv')}`);
});
