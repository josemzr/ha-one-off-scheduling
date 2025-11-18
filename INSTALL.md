# Quick Start: Deploy Your Add-on

This file provides quick instructions for deploying the One-Off Scheduling add-on to your Home Assistant instance.

## What Was Created

A complete Home Assistant add-on has been created with all necessary configuration files:

- **config.yaml**: Add-on configuration and metadata
- **Dockerfile**: Instructions for building the container
- **run.sh**: Entry point that starts the application
- **build.yaml**: Multi-architecture build configuration
- **Documentation**: Complete user guides (ADDON_README.md, DOCS.md, DEPLOYMENT.md)

## How to Deploy to Your Home Assistant Instance

### Step 1: Add the Repository

1. Open your Home Assistant web interface
2. Go to **Settings** → **Add-ons** → **Add-on Store**
3. Click the menu icon (⋮) in the top right
4. Select **Repositories**
5. Add this URL: `https://github.com/jmm-org1/ha-one-off-scheduling`
6. Click **Add**

### Step 2: Install the Add-on

1. Return to the Add-on Store
2. Refresh the page if needed
3. Find "One-Off Scheduling" in the list
4. Click on it
5. Click **Install** (this may take a few minutes)

### Step 3: Start the Add-on

1. After installation completes, click **Start**
2. (Optional) Enable **Start on boot** to auto-start with Home Assistant
3. (Optional) Enable **Watchdog** for automatic recovery

### Step 4: Access the Web UI

1. Click **Open Web UI** in the add-on page
2. Or navigate to: `http://your-homeassistant-address:3000`

That's it! The add-on will automatically connect to your Home Assistant instance.

## Configuration

The add-on requires no configuration to work! However, you can customize:

- **Port**: Change from default 3000 to another port
  ```yaml
  port: 8080
  ```

## What Happens Behind the Scenes

When you install the add-on:

1. Home Assistant downloads the repository
2. Builds a Docker container with Node.js and the application
3. Configures automatic connection to Home Assistant (no token needed!)
4. Makes the web UI available through your Home Assistant instance

## Troubleshooting

If you encounter issues:

1. **Check the Logs**: Click on the **Log** tab in the add-on page
2. **Verify Port**: Make sure port 3000 (or your custom port) isn't already in use
3. **Restart**: Try restarting the add-on
4. **Review Documentation**: See DEPLOYMENT.md for detailed troubleshooting

## Full Documentation

For complete documentation, see:

- **DEPLOYMENT.md**: Comprehensive deployment guide
- **DOCS.md**: Detailed usage instructions
- **ADDON_README.md**: Add-on specific information
- **README.md**: Application features and capabilities

## Support

For issues or questions:
- GitHub Issues: https://github.com/jmm-org1/ha-one-off-scheduling/issues
- Repository: https://github.com/jmm-org1/ha-one-off-scheduling

Enjoy your One-Off Scheduling add-on! 🎉
