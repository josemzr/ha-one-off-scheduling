ARG BUILD_FROM
FROM $BUILD_FROM

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install Node.js, npm, and native build tools needed by better-sqlite3
RUN apk add --no-cache \
    nodejs \
    npm \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies (includes native compilation of better-sqlite3)
RUN npm ci --only=production

# Remove build tools that are no longer needed to reduce image size
RUN apk del python3 make g++

# Copy application files
COPY server.js mcp-server.js rest-api.js db.js ./
COPY public ./public/

# Create persistent data directory (mapped by HA add-on)
RUN mkdir -p /data

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Expose port
EXPOSE 3000

# Run the application
CMD ["/run.sh"]
