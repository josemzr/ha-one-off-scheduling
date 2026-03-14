# Docker Deployment Guide

This guide explains how to deploy the Home Assistant One-Off Scheduling application with its MCP server using Docker.

## Deployment Options

### Option 1: Docker Compose (Recommended)

**Best for**: Running both the web interface and MCP server together

#### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/josemzr/ha-one-off-scheduling.git
cd ha-one-off-scheduling
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Edit `.env` with your Home Assistant details:
```env
HA_URL=http://your-ha-ip:8123
HA_TOKEN=your_long_lived_access_token
```

4. Start the services:
```bash
./start.sh
# Or manually:
docker compose up -d
```

5. Access the application:
- Web Interface: http://localhost:3000
- MCP Server: Port 8000 (stdio/HTTP)

#### Managing Services

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after code changes
docker compose up --build -d

# View service status
docker compose ps
```

### Option 2: Combined Docker Image

**Best for**: Single container deployment

Build and run both services in one container using supervisord:

```bash
# Build the image
docker build -f Dockerfile.combined -t ha-scheduling-combined .

# Run the container
docker run -d \
  --name ha-scheduling \
  -p 3000:3000 \
  -p 8000:8000 \
  -e HA_URL=http://your-ha-ip:8123 \
  -e HA_TOKEN=your_token \
  ha-scheduling-combined

# View logs
docker logs -f ha-scheduling

# Stop container
docker stop ha-scheduling
docker rm ha-scheduling
```

### Option 3: Separate Services

**Best for**: Microservices architecture

#### Web Service Only

```bash
docker build -t ha-scheduling-web .
docker run -d \
  --name ha-web \
  -p 3000:3000 \
  -e HA_URL=http://your-ha-ip:8123 \
  -e HA_TOKEN=your_token \
  ha-scheduling-web
```

#### MCP Service Only

```bash
docker build -f Dockerfile.mcp -t ha-scheduling-mcp .
docker run -d \
  --name ha-mcp \
  -p 8000:8000 \
  -e HA_URL=http://your-ha-ip:8123 \
  -e HA_TOKEN=your_token \
  -e NODE_SERVER_URL=http://ha-web:3000 \
  --link ha-web \
  ha-scheduling-mcp
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HA_URL` | Home Assistant URL | `http://homeassistant.local:8123` |
| `HA_TOKEN` | Home Assistant access token | (required) |
| `SUPERVISOR_TOKEN` | HA Supervisor token (add-on mode) | - |
| `PORT` | Web server port | `3000` |
| `NODE_SERVER_URL` | Node.js server URL (for MCP) | `http://localhost:3000` |

## Networking

### Docker Compose Network

Services communicate through a bridge network named `ha-scheduling`:

- `web` service: Accessible as `http://web:3000` internally
- `mcp` service: Accessible as `http://mcp:8000` internally

### External Access

- Web Interface: Port 3000 (mapped to host)
- MCP Server: Port 8000 (mapped to host)

## Volume Mounts (Optional)

To persist data or enable hot-reload during development:

```yaml
services:
  web:
    volumes:
      - ./server.js:/app/server.js
      - ./public:/app/public
  mcp:
    volumes:
      - ./mcp_server.py:/app/mcp_server.py
```

## Health Checks

### Check Web Service

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "haConnected": true
}
```

### Check MCP Service

The MCP server runs on port 8000 and communicates via stdio or HTTP depending on the client.

## Troubleshooting

### Services Won't Start

1. Check Docker is running:
```bash
docker info
```

2. Check logs:
```bash
docker compose logs
```

3. Verify environment variables:
```bash
docker compose config
```

### Can't Connect to Home Assistant

1. Verify HA_URL is accessible from container:
```bash
docker compose exec web curl $HA_URL/api/
```

2. Check token is valid:
- Go to Home Assistant → Profile → Long-Lived Access Tokens
- Regenerate token if needed

3. Check network connectivity:
```bash
# From host
ping your-ha-ip

# From container
docker compose exec web ping your-ha-ip
```

### MCP Server Not Working

1. Check the web service is running:
```bash
docker compose ps web
```

2. Verify MCP can reach web service:
```bash
docker compose exec mcp curl http://web:3000/api/health
```

3. Check MCP logs:
```bash
docker compose logs mcp
```

## Security Considerations

1. **Never commit .env files** with real tokens
2. **Use secrets** in production:
```yaml
services:
  web:
    environment:
      HA_TOKEN: ${HA_TOKEN}
    secrets:
      - ha_token

secrets:
  ha_token:
    file: ./secrets/ha_token.txt
```

3. **Use HTTPS** in production with reverse proxy
4. **Limit network access** using firewall rules
5. **Run as non-root** user (add user in Dockerfile)

## Production Deployment

### With Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name scheduler.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /mcp/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### With SSL/TLS

Use Let's Encrypt with certbot:
```bash
certbot --nginx -d scheduler.example.com
```

### Automatic Restart

Docker Compose already includes `restart: unless-stopped`. For systemd:

```ini
# /etc/systemd/system/ha-scheduling.service
[Unit]
Description=HA Scheduling Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/ha-one-off-scheduling
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose restart

[Install]
WantedBy=multi-user.target
```

## Monitoring

### Container Stats

```bash
docker stats
```

### Resource Limits

Add to docker-compose.yml:
```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
  mcp:
    deploy:
      resources:
        limits:
          cpus: '0.3'
          memory: 256M
```

## Backup

Scheduled jobs are stored in memory. To persist:

1. Implement persistent storage (Redis/DB)
2. Back up container state:
```bash
docker commit ha-scheduling ha-scheduling-backup
```

## Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose up --build -d
```
