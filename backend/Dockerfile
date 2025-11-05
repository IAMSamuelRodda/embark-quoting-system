# ===================================================================
# Embark Quoting System - Backend Docker Container
# ===================================================================
# Node.js 20 with Express, PostgreSQL, and Drizzle ORM
# Includes database migrations and health checks

FROM node:20-alpine AS base

# Install all dependencies (needed for migrations)
FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Production stage
FROM base AS production
WORKDIR /app

# Copy all dependencies (migrations need drizzle-orm and drizzle-kit)
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY package*.json ./
COPY src ./src
COPY database ./database
COPY drizzle.config.js ./

# Create entrypoint script for migrations
RUN echo '#!/bin/sh' > /app/docker-entrypoint.sh && \
    echo 'set -e' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "🔄 Running database migrations..."' >> /app/docker-entrypoint.sh && \
    echo 'node database/migrate.js || echo "⚠️  Migration failed, continuing..."' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "🚀 Starting application..."' >> /app/docker-entrypoint.sh && \
    echo 'exec node src/index.js' >> /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]
