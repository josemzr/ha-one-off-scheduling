---
name: ha-one-off-scheduling
description: Schedule one-off actions for Home Assistant entities via the HA One-Off Scheduling REST API.
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - HA_SCHEDULING_URL
        - HA_SCHEDULING_TOKEN
    primaryEnv: HA_SCHEDULING_TOKEN
    emoji: "⏰"
    homepage: https://github.com/jmm-org1/ha-one-off-scheduling
    os:
      - linux
      - macos
      - windows
---

# Home Assistant One-Off Scheduling Skill

This skill allows the agent to manage one-off scheduled actions on Home Assistant entities (lights, switches, climate, locks, covers, fans) through the HA One-Off Scheduling REST API.

## Configuration

Two environment variables are required:

- `HA_SCHEDULING_URL` — Base URL of the add-on (e.g. `http://homeassistant.local:3000`).
- `HA_SCHEDULING_TOKEN` — Bearer token for REST API authentication (the `mcp_auth_token` value configured in the add-on).

Every request **must** include the header:

```
Authorization: Bearer ${HA_SCHEDULING_TOKEN}
```

## Available Operations

### 1. Check Health

Verify that the server and the Home Assistant connection are working.

- **Method:** `GET`
- **URL:** `${HA_SCHEDULING_URL}/api/v1/health`

Example response:

```json
{ "status": "ok", "haConnected": true }
```

Use this as the first call to confirm connectivity before performing other operations.

### 2. Get Entities

Retrieve all actionable Home Assistant entities (lights, switches, climate, locks, covers, fans).

- **Method:** `GET`
- **URL:** `${HA_SCHEDULING_URL}/api/v1/entities`
- **Optional query parameter:** `entity_type` — filter by domain (e.g. `light`, `switch`, `climate`, `lock`, `cover`, `fan`).

Example — get only lights:

```
GET ${HA_SCHEDULING_URL}/api/v1/entities?entity_type=light
```

Returns an array of entity objects with `entity_id`, `state`, and `attributes`.

### 3. Get Entity State

Get the current state of a specific entity.

- **Method:** `GET`
- **URL:** `${HA_SCHEDULING_URL}/api/v1/entities/{entity_id}/state`

Replace `{entity_id}` with the full entity ID (e.g. `light.living_room`).

Returns the entity object with `entity_id`, `state`, and `attributes`, or a 404 error if the entity is not found.

### 4. Get Services

List all available Home Assistant services.

- **Method:** `GET`
- **URL:** `${HA_SCHEDULING_URL}/api/v1/services`

Returns an array of service domain objects, each containing the services available for that domain.

### 5. Schedule Action

Schedule a one-off action for a Home Assistant entity. This is the core operation.

- **Method:** `POST`
- **URL:** `${HA_SCHEDULING_URL}/api/v1/schedule`
- **Content-Type:** `application/json`

#### Request body fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entity_id` | string | yes | Target entity (e.g. `light.living_room`) |
| `service` | string | yes | Service to call (e.g. `turn_on`, `turn_off`, `restore_state`) |
| `schedule_type` | string | yes | `"immediate"` (run now), `"relative"` (seconds from now), or `"absolute"` (ISO 8601 datetime) |
| `schedule_value` | string | conditional | Required for `relative` (seconds, e.g. `"60"`) and `absolute` (e.g. `"2026-03-15T14:30:00"`) types. Not needed for `immediate`. |
| `service_data` | object | no | Additional service parameters (see examples below) |

#### Examples

**Turn on a light immediately with brightness:**

```json
{
  "entity_id": "light.living_room",
  "service": "turn_on",
  "schedule_type": "immediate",
  "service_data": { "brightness": 255 }
}
```

**Turn off a switch in 5 minutes (300 seconds):**

```json
{
  "entity_id": "switch.heater",
  "service": "turn_off",
  "schedule_type": "relative",
  "schedule_value": "300"
}
```

**Set climate at a specific time:**

```json
{
  "entity_id": "climate.thermostat",
  "service": "restore_state",
  "schedule_type": "absolute",
  "schedule_value": "2026-03-15T14:30:00",
  "service_data": {
    "hvac_mode": "heat",
    "temperature": 22,
    "fan_mode": "auto"
  }
}
```

A successful response includes `jobId` and `scheduleDate` for scheduled actions, or `{ "success": true, "immediate": true }` for immediate ones.

### 6. Get Scheduled Jobs

Retrieve all currently pending scheduled jobs.

- **Method:** `GET`
- **URL:** `${HA_SCHEDULING_URL}/api/v1/jobs`

Returns an array of job objects with `id`, `entityId`, `service`, `serviceData`, and `scheduleDate`.

### 7. Cancel Scheduled Job

Cancel a pending scheduled job by its ID.

- **Method:** `DELETE`
- **URL:** `${HA_SCHEDULING_URL}/api/v1/jobs/{job_id}`

Replace `{job_id}` with the numeric job ID (obtained from the schedule response or the jobs list).

Returns `{ "success": true }` on success, or a 404 error if the job is not found.

## Agent Instructions

When the user asks to control or schedule Home Assistant devices, follow these steps:

1. **Always call the health endpoint first** to confirm the server is reachable.
2. **Use `GET /api/v1/entities`** to discover available entities if the user has not specified one. Present the results clearly.
3. **Use `GET /api/v1/entities/{entity_id}/state`** when the user wants to know the current state of a device.
4. **Use `POST /api/v1/schedule`** to schedule or immediately execute actions. Choose the appropriate `schedule_type`:
   - Use `"immediate"` when the user says "now", "right now", or similar.
   - Use `"relative"` when the user specifies a duration (e.g. "in 10 minutes" → `"schedule_value": "600"`). Convert minutes to seconds.
   - Use `"absolute"` when the user specifies a date/time. Convert to ISO 8601 format.
5. **Use `GET /api/v1/jobs`** when the user asks what actions are pending.
6. **Use `DELETE /api/v1/jobs/{job_id}`** when the user wants to cancel a scheduled action.
7. **Use `GET /api/v1/services`** when the user asks what services or actions are available for a domain.

### Supported entity types and common services

| Entity Type | Common Services |
|-------------|-----------------|
| `light` | `turn_on` (with `brightness`, `color_temp`), `turn_off` |
| `switch` | `turn_on`, `turn_off` |
| `climate` | `set_temperature`, `set_hvac_mode`, `set_fan_mode`, `restore_state` |
| `lock` | `lock`, `unlock` |
| `cover` | `open_cover`, `close_cover`, `set_cover_position` |
| `fan` | `turn_on` (with `percentage`), `turn_off` |

### Error handling

- If a request returns a **401** error, inform the user that the token is invalid or missing.
- If a request returns a **404** error, the entity or job was not found — ask the user to verify the ID.
- If a request returns a **400** error, a required field is missing or invalid — check the request body.
- If a request returns a **500** error, there is a server-side issue — suggest the user check the add-on logs.
