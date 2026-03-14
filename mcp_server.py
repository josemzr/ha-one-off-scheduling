#!/usr/bin/env python3
"""
MCP Server for Home Assistant One-Off Scheduling
Provides MCP interface to schedule and manage one-off automations in Home Assistant
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
import httpx
from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("ha-one-off-scheduling")

# Configuration from environment
HA_URL = os.getenv("HA_URL", "http://localhost:8123")
HA_TOKEN = os.getenv("SUPERVISOR_TOKEN") or os.getenv("HA_TOKEN", "")
NODE_SERVER_URL = os.getenv("NODE_SERVER_URL", "http://localhost:3000")


async def call_home_assistant(endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Any:
    """Make API calls to Home Assistant"""
    headers = {
        "Authorization": f"Bearer {HA_TOKEN}",
        "Content-Type": "application/json"
    }

    url = f"{HA_URL}/api/{endpoint}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        response.raise_for_status()
        return response.json()


async def call_node_server(endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Any:
    """Make API calls to the Node.js server"""
    url = f"{NODE_SERVER_URL}/api/{endpoint}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == "GET":
            response = await client.get(url)
        elif method == "POST":
            response = await client.post(url, json=data)
        elif method == "DELETE":
            response = await client.delete(url)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        response.raise_for_status()
        return response.json()


@mcp.tool()
async def get_entities(domain: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get all actionable entities from Home Assistant.

    Args:
        domain: Optional domain filter (light, switch, climate, lock, cover, fan)

    Returns:
        List of entity objects with their current states and attributes
    """
    states = await call_home_assistant("states")

    # Filter for actionable entities
    actionable_domains = ['light', 'switch', 'climate', 'lock', 'cover', 'fan']
    filtered = [
        entity for entity in states
        if entity['entity_id'].split('.')[0] in actionable_domains
    ]

    # Apply domain filter if specified
    if domain:
        filtered = [
            entity for entity in filtered
            if entity['entity_id'].split('.')[0] == domain
        ]

    return filtered


@mcp.tool()
async def get_entity_state(entity_id: str) -> Dict[str, Any]:
    """
    Get the current state and attributes of a specific entity.

    Args:
        entity_id: The entity ID (e.g., 'light.living_room')

    Returns:
        Entity state object with current state and attributes
    """
    return await call_home_assistant(f"states/{entity_id}")


@mcp.tool()
async def schedule_action(
    entity_id: str,
    service: str,
    schedule_type: str,
    schedule_value: str,
    service_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Schedule a one-off action for a Home Assistant entity.

    Args:
        entity_id: The entity ID to control (e.g., 'light.living_room')
        service: The service to call (e.g., 'turn_on', 'turn_off', 'set_temperature')
        schedule_type: Either 'relative' (minutes from now) or 'absolute' (specific datetime)
        schedule_value: For relative: number of minutes (e.g., '20'). For absolute: ISO datetime string
        service_data: Optional service-specific parameters (e.g., brightness, temperature)

    Returns:
        Success response with jobId and scheduled datetime
    """
    payload = {
        "entityId": entity_id,
        "service": service,
        "scheduleType": schedule_type,
        "scheduleValue": schedule_value,
        "serviceData": service_data or {}
    }

    return await call_node_server("schedule", method="POST", data=payload)


@mcp.tool()
async def get_scheduled_jobs() -> List[Dict[str, Any]]:
    """
    Get all currently scheduled jobs.

    Returns:
        List of scheduled job objects with details about each scheduled action
    """
    return await call_node_server("scheduled")


@mcp.tool()
async def cancel_scheduled_job(job_id: int) -> Dict[str, Any]:
    """
    Cancel a scheduled job.

    Args:
        job_id: The ID of the job to cancel

    Returns:
        Success response
    """
    return await call_node_server(f"schedule/{job_id}", method="DELETE")


@mcp.tool()
async def get_available_services(domain: Optional[str] = None) -> Dict[str, Any]:
    """
    Get available Home Assistant services.

    Args:
        domain: Optional domain to filter services (e.g., 'light', 'switch')

    Returns:
        Dictionary of available services organized by domain
    """
    services = await call_home_assistant("services")

    if domain:
        return {domain: services.get(domain, {})}

    return services


@mcp.tool()
async def health_check() -> Dict[str, Any]:
    """
    Check the health of the scheduling service and Home Assistant connection.

    Returns:
        Health status information
    """
    try:
        node_health = await call_node_server("health")
        return {
            "status": "ok",
            "node_server": node_health,
            "ha_url": HA_URL,
            "has_token": bool(HA_TOKEN)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "ha_url": HA_URL,
            "has_token": bool(HA_TOKEN)
        }


@mcp.tool()
async def turn_on_entity(
    entity_id: str,
    brightness: Optional[int] = None,
    color_temp: Optional[int] = None,
    rgb_color: Optional[List[int]] = None
) -> Dict[str, Any]:
    """
    Turn on an entity immediately (useful for lights, switches, fans).

    Args:
        entity_id: The entity ID to turn on
        brightness: Optional brightness (0-255) for lights
        color_temp: Optional color temperature (mireds) for lights
        rgb_color: Optional RGB color as [r, g, b] for lights

    Returns:
        Response from Home Assistant
    """
    domain = entity_id.split('.')[0]
    service_data = {"entity_id": entity_id}

    if brightness is not None:
        service_data["brightness"] = brightness
    if color_temp is not None:
        service_data["color_temp"] = color_temp
    if rgb_color is not None:
        service_data["rgb_color"] = rgb_color

    return await call_home_assistant(f"services/{domain}/turn_on", method="POST", data=service_data)


@mcp.tool()
async def turn_off_entity(entity_id: str) -> Dict[str, Any]:
    """
    Turn off an entity immediately (useful for lights, switches, fans).

    Args:
        entity_id: The entity ID to turn off

    Returns:
        Response from Home Assistant
    """
    domain = entity_id.split('.')[0]
    service_data = {"entity_id": entity_id}

    return await call_home_assistant(f"services/{domain}/turn_off", method="POST", data=service_data)


@mcp.tool()
async def set_climate_temperature(
    entity_id: str,
    temperature: float,
    hvac_mode: Optional[str] = None
) -> Dict[str, Any]:
    """
    Set climate entity temperature immediately.

    Args:
        entity_id: The climate entity ID
        temperature: Target temperature
        hvac_mode: Optional HVAC mode (heat, cool, heat_cool, auto, off)

    Returns:
        Response from Home Assistant
    """
    service_data = {
        "entity_id": entity_id,
        "temperature": temperature
    }

    if hvac_mode:
        service_data["hvac_mode"] = hvac_mode

    return await call_home_assistant("services/climate/set_temperature", method="POST", data=service_data)


@mcp.tool()
async def set_cover_position(entity_id: str, position: int) -> Dict[str, Any]:
    """
    Set cover position immediately.

    Args:
        entity_id: The cover entity ID
        position: Position (0-100, where 0 is closed and 100 is open)

    Returns:
        Response from Home Assistant
    """
    service_data = {
        "entity_id": entity_id,
        "position": position
    }

    return await call_home_assistant("services/cover/set_cover_position", method="POST", data=service_data)


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
