# Home Assistant One-Off Scheduling

A responsive web application for scheduling one-off automations in Home Assistant. This application allows you to easily schedule future actions for your Home Assistant entities without creating complex automations.

## Features

- 🏠 **Entity Management**: View and filter all actionable entities (lights, switches, climate, locks, covers, fans)
- ⏰ **Flexible Scheduling**: Schedule actions using relative time (e.g., "in 20 minutes") or absolute time (e.g., "at 14:30")
- 🎛️ **Entity-Specific Parameters**: Configure appropriate parameters for different entity types:
  - Lights: brightness, color temperature
  - Climate: temperature, HVAC mode
  - Covers: position
  - Fans: speed percentage
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 📋 **Job Management**: View and cancel scheduled actions
- 🔄 **Real-time Updates**: Auto-refresh scheduled jobs list

## Home Assistant Add-on

This project is available as a Home Assistant add-on, making it easy to integrate with your smart home setup. The add-on:

- Automatically connects to your Home Assistant instance (no token configuration needed)
- Runs as a native add-on in the Supervisor
- Supports all architectures (amd64, aarch64, armv7, armhf, i386)
- Provides a web UI accessible through Home Assistant
- Auto-starts with Home Assistant (optional)

See the [Installation](#installation) section below for setup instructions.

## Prerequisites (Standalone Installation Only)

- Node.js (v14 or higher)
- Home Assistant instance with API access
- Long-lived access token from Home Assistant

## Installation

### Option 1: Home Assistant Add-on (Recommended)

The easiest way to use this application is as a Home Assistant add-on:

1. Navigate to **Settings** → **Add-ons** → **Add-on Store** in your Home Assistant instance
2. Click the menu icon (⋮) in the top right and select **Repositories**
3. Add this repository URL: `https://github.com/jmm-org1/ha-one-off-scheduling`
4. Click **Add**
5. Find "One-Off Scheduling" in the list of add-ons
6. Click on it and then click **Install**
7. Once installed, click **Start**
8. (Optional) Enable **Start on boot** and **Watchdog** for automatic startup
9. Click **Open Web UI** to access the application

The add-on automatically connects to your Home Assistant instance - no configuration needed!

### Option 2: Standalone Installation

If you prefer to run the application outside of Home Assistant:

1. Clone the repository:
```bash
git clone https://github.com/jmm-org1/ha-one-off-scheduling.git
cd ha-one-off-scheduling
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and configure your Home Assistant connection:
```env
HA_URL=http://your-homeassistant-ip:8123
HA_TOKEN=your_long_lived_access_token_here
PORT=3000
```

#### Getting a Home Assistant Long-Lived Access Token

1. Log in to your Home Assistant instance
2. Click on your username in the bottom left corner
3. Scroll down to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Give it a name (e.g., "Scheduler App")
6. Copy the token and paste it in your `.env` file

## Usage

### Demo Mode (Without Home Assistant)

To try out the application without a Home Assistant instance:

```bash
npm run demo
```

This starts a mock server with sample entities that you can use to explore the interface and functionality.

### Production Mode

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. The application will automatically connect to your Home Assistant instance

### Scheduling an Action

1. **Select an Entity**: Browse or search for the entity you want to control
2. **Choose an Action**: Select the action to perform (turn on, turn off, set temperature, etc.)
3. **Configure Parameters** (if applicable): Set entity-specific parameters like brightness or temperature
4. **Set Schedule Time**: Choose either:
   - **Relative**: Number of minutes from now (e.g., 20 for "in 20 minutes")
   - **Absolute**: Specific date and time
5. **Click "Schedule Action"**: The action will be scheduled and appear in the "Scheduled Actions" list

### Managing Scheduled Actions

- View all scheduled actions in the "Scheduled Actions" section
- Cancel any scheduled action by clicking the "Cancel" button
- Scheduled actions are automatically executed at the specified time

## Supported Entity Types

- **Lights** (`light.*`): Turn on/off with brightness and color control
- **Switches** (`switch.*`): Turn on/off
- **Climate** (`climate.*`): Set temperature and HVAC mode
- **Locks** (`lock.*`): Lock/unlock
- **Covers** (`cover.*`): Open/close/set position
- **Fans** (`fan.*`): Turn on/off with speed control

## Development

The application consists of:
- `server.js`: Express server with Home Assistant API integration and job scheduling
- `public/index.html`: Main application interface
- `public/styles.css`: Responsive styling
- `public/app.js`: Frontend JavaScript for UI interactions

## Security Notes

- Never commit your `.env` file with sensitive tokens
- Use HTTPS in production environments
- Keep your Home Assistant token secure
- Consider using reverse proxy with authentication for production deployments

## Troubleshooting

**Connection Issues:**
- Verify `HA_URL` is correct in `.env`
- Ensure the token has not expired
- Check that Home Assistant is accessible from the server

**Entities Not Showing:**
- Verify the token has proper permissions
- Check Home Assistant logs for API errors
- Ensure entities are not hidden in Home Assistant

**Scheduled Actions Not Executing:**
- Check server logs for errors
- Verify the server is running continuously
- Ensure system time is correct

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
