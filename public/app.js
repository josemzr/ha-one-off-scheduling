// State
let entities = [];
let selectedEntity = null;
let services = {};

// Entity icons mapping
const entityIcons = {
    light: '💡',
    switch: '🔌',
    climate: '🌡️',
    lock: '🔒',
    cover: '🪟',
    fan: '💨'
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    checkConnection();
    loadEntities();
    loadServices();
    loadScheduledJobs();
    setupEventListeners();
    
    // Refresh scheduled jobs every 10 seconds
    setInterval(loadScheduledJobs, 10000);
});

// Check connection to Home Assistant
async function checkConnection() {
    try {
        const response = await fetch('api/health');
        const data = await response.json();
        const statusEl = document.getElementById('connectionStatus');
        
        if (data.haConnected) {
            statusEl.textContent = 'Connected';
            statusEl.className = 'status-badge connected';
        } else {
            statusEl.textContent = 'Disconnected';
            statusEl.className = 'status-badge disconnected';
        }
    } catch (error) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.textContent = 'Error';
        statusEl.className = 'status-badge disconnected';
    }
}

// Load entities from HA
async function loadEntities() {
    try {
        const response = await fetch('api/entities');
        entities = await response.json();
        displayEntities(entities);
    } catch (error) {
        console.error('Failed to load entities:', error);
        document.getElementById('entityList').innerHTML = 
            '<div class="empty-state">Failed to load entities. Check connection.</div>';
    }
}

// Load available services
async function loadServices() {
    try {
        const response = await fetch('api/services');
        const data = await response.json();
        
        // Transform array format (real HA API) to object format if needed
        if (Array.isArray(data)) {
            services = {};
            data.forEach(item => {
                if (item.domain && item.services) {
                    services[item.domain] = item.services;
                }
            });
        } else {
            // Already in object format (mock server)
            services = data;
        }
    } catch (error) {
        console.error('Failed to load services:', error);
    }
}

// Display entities
function displayEntities(entitiesToDisplay) {
    const entityList = document.getElementById('entityList');
    
    if (entitiesToDisplay.length === 0) {
        entityList.innerHTML = '<div class="empty-state">No entities found</div>';
        return;
    }
    
    entityList.innerHTML = entitiesToDisplay.map(entity => {
        const domain = entity.entity_id.split('.')[0];
        const icon = entityIcons[domain] || '⚙️';
        const friendlyName = entity.attributes.friendly_name || entity.entity_id;
        const state = entity.state;
        
        let stateClass = 'entity-state';
        if (state === 'on') stateClass += ' on';
        else if (state === 'off') stateClass += ' off';
        else if (state === 'locked') stateClass += ' locked';
        else if (state === 'unlocked') stateClass += ' unlocked';
        
        return `
            <div class="entity-item" data-entity-id="${entity.entity_id}">
                <div class="entity-info-main">
                    <div class="entity-name">${icon} ${friendlyName}</div>
                    <div class="entity-id">${entity.entity_id}</div>
                </div>
                <div class="${stateClass}">${state}</div>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.entity-item').forEach(item => {
        item.addEventListener('click', () => selectEntity(item.dataset.entityId));
    });
}

// Select an entity
function selectEntity(entityId) {
    selectedEntity = entities.find(e => e.entity_id === entityId);
    
    // Update UI
    document.querySelectorAll('.entity-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`[data-entity-id="${entityId}"]`).classList.add('selected');
    
    // Show schedule section
    document.getElementById('scheduleSection').style.display = 'block';
    
    // Update entity info
    const domain = entityId.split('.')[0];
    const icon = entityIcons[domain] || '⚙️';
    const friendlyName = selectedEntity.attributes.friendly_name || entityId;
    
    document.getElementById('selectedEntityInfo').innerHTML = `
        <div class="entity-name">${icon} ${friendlyName}</div>
        <div class="entity-id">${entityId}</div>
    `;
    
    // Load available actions for this entity
    loadActionsForEntity(domain);
}

// Load actions for selected entity domain
function loadActionsForEntity(domain) {
    const actionSelect = document.getElementById('actionSelect');
    actionSelect.innerHTML = '<option value="">Select an action...</option>';
    
    // Add special "Configure Climate" option for climate entities
    if (domain === 'climate') {
        const configureOption = document.createElement('option');
        configureOption.value = 'configure_climate';
        configureOption.textContent = 'Configure Climate (All Settings)';
        actionSelect.appendChild(configureOption);
    }
    
    if (services[domain]) {
        Object.keys(services[domain]).forEach(serviceName => {
            const option = document.createElement('option');
            option.value = serviceName;
            option.textContent = serviceName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            actionSelect.appendChild(option);
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search filter
    document.getElementById('searchFilter').addEventListener('input', filterEntities);
    
    // Type filter
    document.getElementById('typeFilter').addEventListener('change', filterEntities);
    
    // Schedule type radio buttons
    document.querySelectorAll('input[name="scheduleType"]').forEach(radio => {
        radio.addEventListener('change', toggleScheduleInputs);
    });
    
    // Action select
    document.getElementById('actionSelect').addEventListener('change', handleActionChange);
    
    // Schedule button
    document.getElementById('scheduleBtn').addEventListener('click', scheduleAction);
}

// Filter entities
function filterEntities() {
    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filtered = entities;
    
    // Filter by type
    if (typeFilter !== 'all') {
        filtered = filtered.filter(e => e.entity_id.startsWith(typeFilter + '.'));
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(e => {
            const friendlyName = (e.attributes.friendly_name || '').toLowerCase();
            return e.entity_id.toLowerCase().includes(searchTerm) || 
                   friendlyName.includes(searchTerm);
        });
    }
    
    displayEntities(filtered);
}

// Toggle schedule inputs
function toggleScheduleInputs() {
    const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;
    
    if (scheduleType === 'relative') {
        document.getElementById('relativeSchedule').style.display = 'block';
        document.getElementById('absoluteSchedule').style.display = 'none';
    } else {
        document.getElementById('relativeSchedule').style.display = 'none';
        document.getElementById('absoluteSchedule').style.display = 'block';
        
        // Set minimum datetime to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('absoluteTime').min = now.toISOString().slice(0, 16);
    }
}

// Handle action change
function handleActionChange() {
    const action = document.getElementById('actionSelect').value;
    const domain = selectedEntity.entity_id.split('.')[0];
    const parameterInputs = document.getElementById('parameterInputs');
    const actionParameters = document.getElementById('actionParameters');
    
    if (!action) {
        actionParameters.style.display = 'none';
        return;
    }
    
    // Clear previous parameters
    parameterInputs.innerHTML = '';
    
    // Add domain-specific parameters
    const parameters = getParametersForAction(domain, action);
    
    if (parameters.length > 0) {
        parameters.forEach(param => {
            const div = document.createElement('div');
            div.className = 'parameter-input';
            
            let input;
            if (param.type === 'number') {
                input = `<input type="number" id="param_${param.name}" 
                         min="${param.min || ''}" max="${param.max || ''}" 
                         step="${param.step || 'any'}" placeholder="${param.placeholder || ''}">`;
            } else if (param.type === 'select') {
                input = `<select id="param_${param.name}">
                    ${param.options.map(opt => {
                        const label = opt === '' ? '(Not set)' : opt;
                        return `<option value="${opt}">${label}</option>`;
                    }).join('')}
                </select>`;
            } else {
                input = `<input type="text" id="param_${param.name}" placeholder="${param.placeholder || ''}">`;
            }
            
            div.innerHTML = `
                <label>${param.label}</label>
                ${input}
            `;
            parameterInputs.appendChild(div);
        });
        actionParameters.style.display = 'block';
    } else {
        actionParameters.style.display = 'none';
    }
}

// Get parameters for specific action
function getParametersForAction(domain, action) {
    const parameters = [];
    
    if (domain === 'light') {
        if (action === 'turn_on') {
            parameters.push(
                { name: 'brightness', label: 'Brightness (0-255)', type: 'number', min: 0, max: 255, placeholder: 'Optional' },
                { name: 'color_temp', label: 'Color Temperature', type: 'number', placeholder: 'Optional' }
            );
        }
    } else if (domain === 'climate') {
        if (action === 'configure_climate') {
            // Special combined action for climate entities
            parameters.push(
                { name: 'temperature', label: 'Temperature', type: 'number', step: 0.5, placeholder: 'Optional - e.g., 20.5' },
                { name: 'hvac_mode', label: 'HVAC Mode', type: 'select', 
                  options: ['', 'off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'],
                  placeholder: 'Optional' },
                { name: 'fan_mode', label: 'Fan Mode', type: 'select',
                  options: ['', 'auto', 'low', 'medium', 'high', 'on', 'off'],
                  placeholder: 'Optional' }
            );
        } else if (action === 'set_temperature') {
            parameters.push(
                { name: 'temperature', label: 'Temperature', type: 'number', step: 0.5, placeholder: 'e.g., 20.5' }
            );
        } else if (action === 'set_hvac_mode') {
            parameters.push(
                { name: 'hvac_mode', label: 'HVAC Mode', type: 'select', 
                  options: ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'] }
            );
        }
    } else if (domain === 'cover') {
        if (action === 'set_cover_position') {
            parameters.push(
                { name: 'position', label: 'Position (0-100)', type: 'number', min: 0, max: 100 }
            );
        }
    } else if (domain === 'fan') {
        if (action === 'set_percentage') {
            parameters.push(
                { name: 'percentage', label: 'Speed (%)', type: 'number', min: 0, max: 100 }
            );
        }
    }
    
    return parameters;
}

// Schedule action
async function scheduleAction() {
    const action = document.getElementById('actionSelect').value;
    const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;
    
    if (!selectedEntity || !action) {
        alert('Please select an entity and action');
        return;
    }
    
    let scheduleValue;
    if (scheduleType === 'relative') {
        scheduleValue = document.getElementById('relativeMinutes').value;
        if (!scheduleValue || scheduleValue < 1) {
            alert('Please enter a valid number of minutes');
            return;
        }
    } else {
        scheduleValue = document.getElementById('absoluteTime').value;
        if (!scheduleValue) {
            alert('Please select a date and time');
            return;
        }
    }
    
    // Collect service data from parameters
    const serviceData = {};
    const domain = selectedEntity.entity_id.split('.')[0];
    const parameters = getParametersForAction(domain, action);
    
    parameters.forEach(param => {
        const value = document.getElementById(`param_${param.name}`).value;
        if (value) {
            serviceData[param.name] = param.type === 'number' ? parseFloat(value) : value;
        }
    });
    
    // Handle configure_climate special action
    let actualService = action;
    if (action === 'configure_climate') {
        // For climate configuration, we'll use set_temperature which can accept multiple params
        actualService = 'set_temperature';
        // Validate that at least one parameter is set
        if (Object.keys(serviceData).length === 0) {
            alert('Please set at least one climate parameter (temperature, HVAC mode, or fan mode)');
            return;
        }
    }
    
    try {
        const response = await fetch('api/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                entityId: selectedEntity.entity_id,
                service: actualService,
                serviceData,
                scheduleType,
                scheduleValue
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`Action scheduled successfully for ${new Date(result.scheduleDate).toLocaleString()}`);
            loadScheduledJobs();
            
            // Reset form
            document.getElementById('actionSelect').value = '';
            document.getElementById('actionParameters').style.display = 'none';
        } else {
            alert('Failed to schedule action: ' + result.error);
        }
    } catch (error) {
        alert('Failed to schedule action: ' + error.message);
    }
}

// Load scheduled jobs
async function loadScheduledJobs() {
    try {
        const response = await fetch('api/scheduled');
        const jobs = await response.json();
        
        const scheduledList = document.getElementById('scheduledList');
        
        if (jobs.length === 0) {
            scheduledList.innerHTML = '<div class="empty-state">No scheduled actions yet</div>';
            return;
        }
        
        scheduledList.innerHTML = jobs.map(job => {
            const entity = entities.find(e => e.entity_id === job.entityId);
            const friendlyName = entity ? 
                (entity.attributes.friendly_name || job.entityId) : 
                job.entityId;
            const domain = job.entityId.split('.')[0];
            const icon = entityIcons[domain] || '⚙️';
            const scheduleDate = new Date(job.scheduleDate);
            
            return `
                <div class="scheduled-item">
                    <div class="scheduled-header">
                        <div>
                            <div class="scheduled-entity">${icon} ${friendlyName}</div>
                            <div class="scheduled-action">
                                Action: ${job.service.replace(/_/g, ' ')}
                                ${Object.keys(job.serviceData).length > 0 ? 
                                  `<br>Parameters: ${JSON.stringify(job.serviceData)}` : ''}
                            </div>
                            <div class="scheduled-time">
                                🕐 ${scheduleDate.toLocaleString()}
                            </div>
                        </div>
                        <button class="btn-danger" onclick="cancelJob(${job.id})">Cancel</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load scheduled jobs:', error);
    }
}

// Cancel scheduled job
async function cancelJob(jobId) {
    if (!confirm('Are you sure you want to cancel this scheduled action?')) {
        return;
    }
    
    try {
        const response = await fetch(`api/schedule/${jobId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadScheduledJobs();
        } else {
            alert('Failed to cancel job');
        }
    } catch (error) {
        alert('Failed to cancel job: ' + error.message);
    }
}
