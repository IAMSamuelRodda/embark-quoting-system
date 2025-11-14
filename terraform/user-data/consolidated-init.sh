#!/bin/bash
# ===================================================================
# Consolidated EC2 Initialization Script
# ===================================================================
# Installs Docker and runs backend + database containers on ONE instance
# Cost: $0/month during Free Tier, ~$8/month after
# ===================================================================

set -e
exec > >(tee /var/log/consolidated-init.log)
exec 2>&1

echo "====================================="
echo "Starting consolidated instance setup"
echo "====================================="
echo "Timestamp: $(date)"

# ===================================================================
# 1. Install Docker
# ===================================================================

echo "Installing Docker..."
dnf install -y docker
systemctl enable docker
systemctl start docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# ===================================================================
# 2. Install Docker Compose
# ===================================================================

echo "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="2.24.5"
curl -L "https://github.com/docker/compose/releases/download/v$${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# ===================================================================
# 3. Create Application Directory
# ===================================================================

mkdir -p /opt/embark
cd /opt/embark

# ===================================================================
# 4. Create Docker Compose Configuration
# ===================================================================

echo "Creating Docker Compose configuration..."
cat > docker-compose.yml <<'EOF_COMPOSE'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: embark-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${db_name}
      POSTGRES_USER: ${db_username}
      POSTGRES_PASSWORD: ${db_password}
      # Performance tuning for t3.micro (1 vCPU, 1GB RAM)
      POSTGRES_SHARED_BUFFERS: "128MB"
      POSTGRES_EFFECTIVE_CACHE_SIZE: "384MB"
      POSTGRES_WORK_MEM: "4MB"
      POSTGRES_MAINTENANCE_WORK_MEM: "64MB"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${db_username}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - embark-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # Backend API
  backend:
    image: public.ecr.aws/docker/library/node:18-alpine
    container_name: embark-backend
    restart: unless-stopped
    working_dir: /app
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${db_name}
      DB_USER: ${db_username}
      DB_PASSWORD: ${db_password}
      AWS_REGION: ${aws_region}
    ports:
      - "80:3000"
      - "3000:3000"
    volumes:
      - backend-code:/app
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - embark-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    command: sh -c "
      if [ ! -f package.json ]; then
        echo 'Backend code not deployed yet - creating placeholder...';
        npm init -y;
        npm install express pg;
        cat > index.js <<'EOF_APP'
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Embark Quoting System API',
    status: 'ready',
    environment: process.env.NODE_ENV
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Backend API listening on port \$${PORT}\`);
});
EOF_APP
      fi;
      node index.js
      "

volumes:
  postgres-data:
    driver: local
  backend-code:
    driver: local

networks:
  embark-network:
    driver: bridge
EOF_COMPOSE

# ===================================================================
# 5. Start Services
# ===================================================================

echo "Starting services..."
docker-compose up -d

echo "Waiting for services to be healthy..."
sleep 30

# ===================================================================
# 6. Verify Services
# ===================================================================

echo "Service status:"
docker-compose ps

echo ""
echo "Testing backend health endpoint..."
curl -f http://localhost:3000/health || echo "Backend not ready yet (expected on first boot)"

echo ""
echo "Testing database connection..."
docker exec embark-postgres psql -U ${db_username} -d ${db_name} -c '\l' || echo "Database not ready yet"

# ===================================================================
# 7. Setup Complete
# ===================================================================

echo ""
echo "====================================="
echo "✅ Consolidated instance setup complete!"
echo "====================================="
echo "Backend API: http://localhost:3000"
echo "Database: localhost:5432"
echo ""
echo "View logs:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f postgres"
echo ""
echo "Restart services:"
echo "  docker-compose restart"
echo ""
echo "====================================="
