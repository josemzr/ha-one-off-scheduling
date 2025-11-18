# Deployment Guide for Home Assistant Add-on

This guide explains how to deploy the One-Off Scheduling add-on to your Home Assistant instance.

## Prerequisites

- A running Home Assistant instance with Supervisor (Home Assistant OS, Supervised, or Container with Supervisor)
- Access to your Home Assistant web interface
- (Optional) GitHub account if you want to fork the repository

## Installation Methods

### Method 1: Install from GitHub Repository (Recommended for Testing)

This method allows you to install the add-on directly from this GitHub repository.

1. **Access Home Assistant**
   - Open your Home Assistant web interface
   - Navigate to **Settings** → **Add-ons** → **Add-on Store**

2. **Add Custom Repository**
   - Click the menu icon (⋮) in the top right corner
   - Select **Repositories**
   - Add the repository URL: `https://github.com/jmm-org1/ha-one-off-scheduling`
   - Click **Add**

3. **Install the Add-on**
   - Go back to the Add-on Store
   - Find "One-Off Scheduling" in the list
   - Click on it to open the details page
   - Click **Install**
   - Wait for the installation to complete (this may take several minutes)

4. **Configure the Add-on** (Optional)
   - The default configuration should work for most users
   - If you want to change the port, edit the configuration:
     ```yaml
     port: 3000
     ```
   - Click **Save**

5. **Start the Add-on**
   - Click **Start**
   - Wait for the add-on to start
   - Check the logs to ensure it started successfully

6. **Enable Auto-start** (Optional)
   - Toggle **Start on boot** if you want the add-on to start automatically when Home Assistant starts
   - Toggle **Watchdog** to automatically restart the add-on if it crashes

7. **Access the Web UI**
   - Click **Open Web UI** or navigate to: `http://homeassistant.local:3000`
   - The application will automatically connect to your Home Assistant instance

### Method 2: Local Installation (Advanced)

For testing local changes or development:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/jmm-org1/ha-one-off-scheduling.git
   cd ha-one-off-scheduling
   ```

2. **Copy to Home Assistant Add-ons Directory**
   - If you have direct access to your Home Assistant system:
   ```bash
   # Copy the entire repository to the addons directory
   cp -r /path/to/ha-one-off-scheduling /usr/share/hassio/addons/local/ha-one-off-scheduling
   ```

3. **Reload Add-ons**
   - In Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**
   - Click the menu icon (⋮) and select **Reload**

4. **Install and Start**
   - Find "One-Off Scheduling" in the Local Add-ons section
   - Follow steps 3-7 from Method 1

## Configuration Options

The add-on has the following configuration option:

### `port` (optional)
- **Description**: The TCP port for the web interface
- **Default**: `3000`
- **Valid Range**: `1024-65535`
- **Example**:
  ```yaml
  port: 8080
  ```

## Verifying the Installation

1. **Check the Logs**
   - In the add-on details page, click on the **Log** tab
   - You should see messages like:
     ```
     Starting One-Off Scheduling add-on...
     Port: 3000
     Home Assistant URL: http://supervisor/core
     Server running on port 3000
     ```

2. **Access the Web UI**
   - Click **Open Web UI** or navigate to your Home Assistant URL with port 3000
   - You should see the One-Off Scheduling interface
   - The application should automatically load your entities

## Troubleshooting

### Add-on Won't Start

1. **Check the Logs**
   - Look for error messages in the Log tab
   - Common issues:
     - Port already in use: Change the port in configuration
     - Insufficient system resources: Free up memory/CPU

2. **Check System Requirements**
   - Ensure your Home Assistant system has enough resources
   - Recommended minimum: 1GB RAM, 1 CPU core

### Cannot Access Web UI

1. **Verify Port Configuration**
   - Check that the port in configuration matches the URL you're accessing
   - Default is port 3000

2. **Check Network Settings**
   - Ensure your device can access Home Assistant on the configured port
   - If using a firewall, allow the configured port

3. **Restart the Add-on**
   - Click **Restart** in the add-on details page
   - Wait for it to fully start before accessing the UI

### Entities Not Loading

1. **Check Home Assistant Connection**
   - The add-on automatically connects using the Supervisor API
   - Verify Home Assistant is running and accessible

2. **Check Add-on Logs**
   - Look for connection errors in the logs
   - The add-on should show "Home Assistant URL: http://supervisor/core"

### Scheduled Actions Not Executing

1. **Ensure Add-on is Running**
   - The add-on must remain running for scheduled actions to execute
   - Enable "Start on boot" and "Watchdog" for reliability

2. **Check Logs for Errors**
   - Look for execution errors in the logs
   - Verify the entities still exist in Home Assistant

## Updating the Add-on

When a new version is released:

1. Go to **Settings** → **Add-ons** → **One-Off Scheduling**
2. If an update is available, you'll see an **Update** button
3. Click **Update** and wait for the update to complete
4. Restart the add-on if necessary

## Uninstalling the Add-on

1. Stop the add-on if it's running
2. Click **Uninstall**
3. Confirm the uninstallation
4. (Optional) Remove the repository from the repositories list

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/jmm-org1/ha-one-off-scheduling/issues
- Repository: https://github.com/jmm-org1/ha-one-off-scheduling

## Next Steps

After installation:
- Check out the [DOCS.md](DOCS.md) for detailed usage instructions
- Read the [README.md](README.md) for application features and capabilities
- View the [CHANGELOG.md](CHANGELOG.md) for version history
