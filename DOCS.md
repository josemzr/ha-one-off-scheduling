# Configuration

The One-Off Scheduling add-on requires minimal configuration.

## Options

### Option: `port` (optional)

The TCP port on which the web interface will be available.

```yaml
port: 3000
```

**Default**: `3000`

**Note**: The port must be between 1024 and 65535.

## Usage

### Accessing the Web Interface

After starting the add-on:

1. Click "Open Web UI" in the add-on details page, or
2. Navigate to `http://homeassistant.local:3000` (replace with your Home Assistant URL and configured port)

The web interface will automatically connect to your Home Assistant instance using the Supervisor API.

### Scheduling an Action

1. **Select an Entity**
   - Browse the list of available entities
   - Use the search box to filter by name or type
   - Supported entity types: lights, switches, climate, locks, covers, fans

2. **Choose an Action**
   - Select the appropriate action from the dropdown (e.g., turn on, turn off, set temperature)

3. **Configure Parameters** (if applicable)
   - For lights: Set brightness (0-100%), color temperature
   - For climate: Set target temperature, HVAC mode
   - For covers: Set position (0-100%)
   - For fans: Set speed percentage

4. **Set Schedule Time**
   - **Relative Time**: Enter minutes from now (e.g., 20 for "in 20 minutes")
   - **Absolute Time**: Select a specific date and time

5. **Schedule the Action**
   - Click "Schedule Action"
   - The action appears in the "Scheduled Actions" list

### Managing Scheduled Actions

- All scheduled actions are displayed in the "Scheduled Actions" section
- Each action shows:
  - Entity name and ID
  - Action to be performed
  - Scheduled time
  - Cancel button
- Click "Cancel" to remove a scheduled action before it executes
- The list auto-refreshes every 10 seconds

### Supported Entity Types and Actions

#### Lights (`light.*`)
- **Actions**: Turn on, Turn off
- **Parameters**: Brightness, Color temperature

#### Switches (`switch.*`)
- **Actions**: Turn on, Turn off

#### Climate (`climate.*`)
- **Actions**: Set temperature, Set HVAC mode
- **Parameters**: Temperature, Mode (heat, cool, auto, off)

#### Locks (`lock.*`)
- **Actions**: Lock, Unlock

#### Covers (`cover.*`)
- **Actions**: Open, Close, Set position
- **Parameters**: Position (0-100%)

#### Fans (`fan.*`)
- **Actions**: Turn on, Turn off
- **Parameters**: Speed percentage

## Troubleshooting

### Add-on won't start

Check the add-on logs for error messages. Common issues:
- Port conflict: Change the port in the configuration
- Insufficient resources: Ensure your system meets minimum requirements

### Entities not showing

The add-on automatically discovers entities from your Home Assistant instance. If entities aren't showing:
- Ensure the entities exist and are available in Home Assistant
- Check that the entities are of supported types
- Restart the add-on

### Scheduled actions not executing

- Verify the add-on is running
- Check the add-on logs for error messages
- Ensure the entity is still available in Home Assistant
- Verify the action is supported for the entity

## Support

For issues, feature requests, or questions:
- GitHub Issues: [https://github.com/jmm-org1/ha-one-off-scheduling/issues](https://github.com/jmm-org1/ha-one-off-scheduling/issues)
- Repository: [https://github.com/jmm-org1/ha-one-off-scheduling](https://github.com/jmm-org1/ha-one-off-scheduling)
