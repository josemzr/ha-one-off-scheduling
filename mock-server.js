// Mock server for testing UI without Home Assistant
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Mock entities data
const mockEntities = [
    {
        entity_id: 'light.living_room',
        state: 'on',
        attributes: { friendly_name: 'Living Room Light', brightness: 200 }
    },
    {
        entity_id: 'light.bedroom',
        state: 'off',
        attributes: { friendly_name: 'Bedroom Light' }
    },
    {
        entity_id: 'switch.coffee_maker',
        state: 'off',
        attributes: { friendly_name: 'Coffee Maker' }
    },
    {
        entity_id: 'climate.thermostat',
        state: 'heat',
        attributes: { friendly_name: 'Main Thermostat', temperature: 21.5 }
    },
    {
        entity_id: 'lock.front_door',
        state: 'locked',
        attributes: { friendly_name: 'Front Door Lock' }
    },
    {
        entity_id: 'cover.garage_door',
        state: 'closed',
        attributes: { friendly_name: 'Garage Door' }
    },
    {
        entity_id: 'fan.ceiling_fan',
        state: 'on',
        attributes: { friendly_name: 'Ceiling Fan', percentage: 50 }
    }
];

// Mock services
const mockServices = {
    light: {
        turn_on: {},
        turn_off: {},
        toggle: {}
    },
    switch: {
        turn_on: {},
        turn_off: {},
        toggle: {}
    },
    climate: {
        set_temperature: {},
        set_hvac_mode: {},
        set_fan_mode: {}
    },
    lock: {
        lock: {},
        unlock: {}
    },
    cover: {
        open_cover: {},
        close_cover: {},
        set_cover_position: {}
    },
    fan: {
        turn_on: {},
        turn_off: {},
        set_percentage: {}
    }
};

let scheduledJobs = [];
let jobCounter = 0;

// API Routes
app.get('/api/config', (req, res) => {
    res.json({ ingressPath: '' });
});

app.get('/api/entities', (req, res) => {
    res.json(mockEntities);
});

app.get('/api/services', (req, res) => {
    res.json(mockServices);
});

app.post('/api/schedule', (req, res) => {
    const { entityId, service, serviceData, scheduleType, scheduleValue } = req.body;
    
    let scheduleDate;
    if (scheduleType === 'relative') {
        const minutes = parseInt(scheduleValue);
        scheduleDate = new Date(Date.now() + minutes * 60 * 1000);
    } else {
        scheduleDate = new Date(scheduleValue);
    }
    
    const jobId = ++jobCounter;
    scheduledJobs.push({
        id: jobId,
        entityId,
        service,
        serviceData,
        scheduleDate: scheduleDate.toISOString()
    });
    
    res.json({
        success: true,
        jobId,
        scheduleDate: scheduleDate.toISOString()
    });
});

app.get('/api/scheduled', (req, res) => {
    res.json(scheduledJobs);
});

app.delete('/api/schedule/:jobId', (req, res) => {
    const jobId = parseInt(req.params.jobId);
    scheduledJobs = scheduledJobs.filter(job => job.id !== jobId);
    res.json({ success: true });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', haConnected: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Mock server running on port ${PORT}`);
    console.log('Using mock data for demonstration');
});
