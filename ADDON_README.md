# Home Assistant Add-on: One-Off Scheduling

A responsive web application for scheduling one-off automations in Home Assistant. This add-on allows you to easily schedule future actions for your Home Assistant entities without creating complex automations.

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]
![Supports armhf Architecture][armhf-shield]
![Supports armv7 Architecture][armv7-shield]
![Supports i386 Architecture][i386-shield]

## About

This add-on provides a web interface to schedule one-time actions for your Home Assistant entities. Perfect for scenarios like:

- Turn off the lights in 20 minutes
- Set the thermostat to 22°C at 6 PM tomorrow
- Close the garage door at a specific time
- Schedule any action for lights, switches, climate devices, locks, covers, and fans

### Features

- 🏠 **Entity Management**: View and filter all actionable entities
- ⏰ **Flexible Scheduling**: Schedule using relative time (e.g., "in 20 minutes") or absolute time (e.g., "at 14:30")
- 🎛️ **Entity-Specific Parameters**: Configure brightness, temperature, position, and more
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 📋 **Job Management**: View and cancel scheduled actions
- 🔄 **Real-time Updates**: Auto-refresh scheduled jobs list

## Installation

Follow these steps to install the add-on:

1. Navigate to the Add-on Store in your Home Assistant instance
2. Add this repository to your add-on store:
   - Click the menu icon (three dots) in the top right
   - Select "Repositories"
   - Add the URL: `https://github.com/jmm-org1/ha-one-off-scheduling`
3. Find "One-Off Scheduling" in the list of add-ons
4. Click on the add-on to open its details page
5. Click "Install"
6. Wait for the installation to complete
7. Click "Start"
8. (Optional) Enable "Start on boot" if you want the add-on to start automatically

## Configuration

The add-on uses Home Assistant's ingress feature, which means:
- No additional configuration is needed
- The web UI is accessible directly from the Home Assistant sidebar
- Authentication is handled automatically by Home Assistant
- No need to configure ports or external access

The add-on will automatically connect to your Home Assistant instance using the supervisor API.

## Usage

1. After starting the add-on, it will appear in your Home Assistant sidebar with a calendar-clock icon
2. Click on "One-Off Scheduling" in the sidebar to open the web UI
3. The interface will automatically connect to your Home Assistant instance (no additional setup required)
4. Browse or search for entities you want to control
5. Select an action and configure parameters
6. Set the schedule time (relative or absolute)
7. Click "Schedule Action"
8. View and manage scheduled actions in the "Scheduled Actions" section

**Note:** The add-on uses Home Assistant's ingress feature, so it's accessible directly through the Home Assistant UI without needing to configure external ports or URLs.

## Support

For issues, questions, or feature requests, please visit:
[https://github.com/jmm-org1/ha-one-off-scheduling/issues](https://github.com/jmm-org1/ha-one-off-scheduling/issues)

## License

ISC

[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armhf-shield]: https://img.shields.io/badge/armhf-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[i386-shield]: https://img.shields.io/badge/i386-yes-green.svg
