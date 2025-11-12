#!/bin/bash

################################################################################
# Embark Quoting System - Full-Stack Local Development Launcher
#
# This script automates the complete local development setup:
# 1. Validates prerequisites (AWS CLI, Node.js, Docker, PostgreSQL)
# 2. Starts PostgreSQL database (Docker container)
# 3. Runs database migrations
# 4. Creates/validates environment configuration
# 5. Retrieves staging credentials from AWS Secrets Manager
# 6. Starts backend API server (Express on port 3001)
# 7. Starts frontend dev server (Vite on port 3000)
# 8. Auto-logs in using Playwright browser automation
#
# Usage: ./scripts/dev-start.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_ENV_FILE="$FRONTEND_DIR/.env.local"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"  # Use .env (not .env.local) to override staging config
AUTO_LOGIN_SCRIPT="$FRONTEND_DIR/auto-login.mjs"

# Configuration
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:4000"
BACKEND_PORT=4000
TEST_EMAIL="e2e-test@embark-quoting.local"
SECRET_NAME="embark-quoting/staging/e2e-test-credentials"

# Database configuration
DB_CONTAINER_NAME="embark-dev-db"
DB_USER="embark_dev"
DB_PASSWORD="dev_password"
DB_NAME="embark_quoting_dev"
DB_PORT=5432
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"

# Process tracking
BACKEND_PID=""
FRONTEND_PID=""

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_step() {
    echo -e "${CYAN}→${NC} $1"
}

################################################################################
# Prerequisite Checks
################################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"

    local all_good=true

    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker installed"

        # Check if Docker daemon is running
        if docker ps &> /dev/null; then
            print_success "Docker daemon running"
        else
            print_error "Docker daemon not running"
            print_info "Start Docker Desktop or run: sudo systemctl start docker"
            all_good=false
        fi
    else
        print_error "Docker not installed"
        print_info "Install from: https://docs.docker.com/get-docker/"
        all_good=false
    fi

    # Check AWS CLI
    if command -v aws &> /dev/null; then
        print_success "AWS CLI installed"

        # Check AWS authentication
        if aws sts get-caller-identity &> /dev/null; then
            print_success "AWS CLI authenticated"
        else
            print_error "AWS CLI not authenticated"
            print_info "Run: aws configure"
            all_good=false
        fi
    else
        print_error "AWS CLI not installed"
        print_info "Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        all_good=false
    fi

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed ($NODE_VERSION)"
    else
        print_error "Node.js not installed"
        all_good=false
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed ($NPM_VERSION)"
    else
        print_error "npm not installed"
        all_good=false
    fi

    # Check jq (for JSON parsing)
    if command -v jq &> /dev/null; then
        print_success "jq installed"
    else
        print_warning "jq not installed (needed for AWS Secrets parsing)"
        print_info "Installing jq..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y jq
        elif command -v brew &> /dev/null; then
            brew install jq
        else
            print_error "Cannot install jq automatically. Please install manually."
            all_good=false
        fi
    fi

    # Check frontend dependencies
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        print_success "Frontend dependencies installed"
    else
        print_warning "Frontend dependencies not installed"
        print_info "Installing frontend dependencies..."
        (cd "$FRONTEND_DIR" && npm install)
        print_success "Frontend dependencies installed"
    fi

    # Check backend dependencies
    if [ -d "$BACKEND_DIR/node_modules" ]; then
        print_success "Backend dependencies installed"
    else
        print_warning "Backend dependencies not installed"
        print_info "Installing backend dependencies..."
        (cd "$BACKEND_DIR" && npm install)
        print_success "Backend dependencies installed"
    fi

    # Check Playwright
    if [ -d "$FRONTEND_DIR/node_modules/@playwright" ]; then
        print_success "Playwright installed"
    else
        print_warning "Playwright not installed"
        print_info "Installing Playwright..."
        (cd "$FRONTEND_DIR" && npx playwright install chromium)
        print_success "Playwright installed"
    fi

    if [ "$all_good" = false ]; then
        print_error "Prerequisites check failed. Please fix the issues above."
        exit 1
    fi

    echo ""
}

################################################################################
# Database Management
################################################################################

start_database() {
    print_header "Starting PostgreSQL Database"

    # Check if container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
        print_info "Database container exists"

        # Check if it's running
        if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
            print_success "Database already running"
        else
            print_step "Starting existing container..."
            docker start "$DB_CONTAINER_NAME"
            print_success "Database started"
        fi
    else
        print_step "Creating new PostgreSQL container..."
        docker run -d \
            --name "$DB_CONTAINER_NAME" \
            -e POSTGRES_USER="$DB_USER" \
            -e POSTGRES_PASSWORD="$DB_PASSWORD" \
            -e POSTGRES_DB="$DB_NAME" \
            -p "${DB_PORT}:5432" \
            postgres:15

        print_success "Database container created"
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 5
    fi

    # Wait for PostgreSQL to accept connections
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" &> /dev/null; then
            print_success "Database ready at localhost:$DB_PORT"
            echo ""
            return
        fi

        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done

    echo ""
    print_error "Database failed to start within 30 seconds"
    print_info "Check logs: docker logs $DB_CONTAINER_NAME"
    exit 1
}

run_migrations() {
    print_header "Running Database Migrations"

    cd "$BACKEND_DIR"

    # Check if migrations are needed
    print_step "Checking migration status..."

    # Run migrations
    if DATABASE_URL="$DATABASE_URL" npm run db:migrate 2>&1 | tee /tmp/embark-migration.log; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        print_info "Check logs: /tmp/embark-migration.log"
        exit 1
    fi

    echo ""
}

################################################################################
# Environment Configuration
################################################################################

setup_backend_env() {
    print_header "Configuring Backend Environment"

    # Always recreate .env for local development (overrides any existing config)
    print_info "Creating backend environment file for local development..."
    create_backend_env
    print_success "Backend configured for local database"

    echo ""
}

create_backend_env() {
    cat > "$BACKEND_ENV_FILE" << EOF
# Embark Quoting System - Local Development Environment (Backend)
# Auto-generated by scripts/dev-start.sh

# Server Configuration
PORT=$BACKEND_PORT
NODE_ENV=development

# Database Configuration (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# AWS Configuration
AWS_REGION=ap-southeast-2

# Cognito (Staging - for token validation)
COGNITO_USER_POOL_ID=ap-southeast-2_D2t5oQs37
COGNITO_CLIENT_ID=1li6qn77cs9m2f47pbg8qrd3at

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:$BACKEND_PORT
EOF
    print_success "Backend environment file created"
}

setup_frontend_env() {
    print_header "Configuring Frontend Environment"

    if [ -f "$FRONTEND_ENV_FILE" ]; then
        print_success "Frontend environment file exists: $FRONTEND_ENV_FILE"

        # Check if pointing to local backend
        if grep -q "VITE_API_URL=http://localhost:$BACKEND_PORT" "$FRONTEND_ENV_FILE"; then
            print_success "Frontend configured for local backend"
        else
            print_warning "Frontend not pointing to local backend, updating..."
            create_frontend_env
        fi
    else
        print_info "Creating frontend environment file..."
        create_frontend_env
    fi

    echo ""
}

create_frontend_env() {
    cat > "$FRONTEND_ENV_FILE" << EOF
# Embark Quoting System - Local Development Environment (Frontend)
# Auto-generated by scripts/dev-start.sh

# AWS Region
VITE_AWS_REGION=ap-southeast-2

# Cognito Configuration (Staging Pool)
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_D2t5oQs37
VITE_COGNITO_CLIENT_ID=1li6qn77cs9m2f47pbg8qrd3at

# API Configuration (Local Backend)
VITE_API_URL=http://localhost:$BACKEND_PORT
EOF
    print_success "Frontend environment file created (pointing to local backend)"
}

################################################################################
# AWS Secrets Retrieval
################################################################################

retrieve_credentials() {
    print_header "Retrieving Login Credentials"

    print_info "Fetching credentials from AWS Secrets Manager..."

    if SECRET_JSON=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --query SecretString \
        --output text 2>/dev/null); then

        # Parse JSON to extract password
        PASSWORD=$(echo "$SECRET_JSON" | jq -r '.password')
        EMAIL=$(echo "$SECRET_JSON" | jq -r '.email')

        if [ -z "$PASSWORD" ] || [ "$PASSWORD" = "null" ]; then
            print_error "Failed to parse password from secret JSON"
            exit 1
        fi

        print_success "Credentials retrieved successfully"

        # Export for use in Playwright script
        export DEV_PASSWORD="$PASSWORD"
        export DEV_EMAIL="${EMAIL:-$TEST_EMAIL}"

        print_info "Email: $DEV_EMAIL"
        print_info "Password: [retrieved from $SECRET_NAME]"
    else
        print_error "Failed to retrieve credentials from AWS Secrets Manager"
        print_info "Ensure you have access to secret: $SECRET_NAME"
        exit 1
    fi

    echo ""
}

################################################################################
# Backend Server
################################################################################

start_backend() {
    print_header "Starting Backend API Server"

    # Check if backend is already running
    if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
        print_warning "Backend API already running at $BACKEND_URL"
        return
    fi

    print_info "Starting Express server on port $BACKEND_PORT..."

    # Start backend in background
    cd "$BACKEND_DIR"
    npm run dev > /tmp/embark-backend.log 2>&1 &
    BACKEND_PID=$!

    # Save PID for cleanup
    echo $BACKEND_PID > /tmp/embark-backend.pid

    print_info "Backend server starting (PID: $BACKEND_PID)..."
    print_info "Waiting for backend to be ready..."

    # Wait for backend to be ready (max 30 seconds)
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
            print_success "Backend API ready at $BACKEND_URL"
            print_info "Health check: $BACKEND_URL/health"
            print_info "Logs: /tmp/embark-backend.log"
            echo ""
            return
        fi

        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done

    echo ""
    print_error "Backend failed to start within 30 seconds"
    print_info "Check logs: /tmp/embark-backend.log"
    tail -20 /tmp/embark-backend.log
    exit 1
}

################################################################################
# Frontend Server
################################################################################

start_frontend() {
    print_header "Starting Frontend Dev Server"

    # Check if server is already running
    if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
        print_warning "Frontend dev server already running at $FRONTEND_URL"
        return
    fi

    print_info "Starting Vite dev server on port 3000..."

    # Start frontend in background
    cd "$FRONTEND_DIR"
    npm run dev > /tmp/embark-frontend.log 2>&1 &
    FRONTEND_PID=$!

    # Save PID for cleanup
    echo $FRONTEND_PID > /tmp/embark-frontend.pid

    print_info "Frontend server starting (PID: $FRONTEND_PID)..."
    print_info "Waiting for frontend to be ready..."

    # Wait for server to be ready (max 30 seconds)
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
            print_success "Frontend dev server ready at $FRONTEND_URL"
            print_info "Logs: /tmp/embark-frontend.log"
            echo ""
            return
        fi

        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done

    echo ""
    print_error "Frontend failed to start within 30 seconds"
    print_info "Check logs: /tmp/embark-frontend.log"
    exit 1
}

################################################################################
# Automatic Login
################################################################################

perform_auto_login() {
    print_header "Performing Automatic Login"

    print_info "Launching browser with Playwright..."
    print_info "This will auto-fill credentials and log you in..."

    # Run Playwright auto-login script from frontend directory (where node_modules is)
    cd "$FRONTEND_DIR"
    DEV_URL="$FRONTEND_URL" \
    DEV_EMAIL="$DEV_EMAIL" \
    DEV_PASSWORD="$DEV_PASSWORD" \
    node ./auto-login.mjs

    if [ $? -eq 0 ]; then
        print_success "Auto-login complete!"
        echo ""
        print_info "Browser is now open and logged in at $FRONTEND_URL"
        print_info "You can start testing immediately!"
    else
        print_error "Auto-login failed"
        print_info "Opening browser manually - you'll need to log in yourself"
        print_info "Email: $DEV_EMAIL"
        print_info "Password: (check AWS Secrets Manager or terminal above)"

        # Fallback: open browser manually
        if command -v xdg-open &> /dev/null; then
            xdg-open "$FRONTEND_URL" &
        elif command -v open &> /dev/null; then
            open "$FRONTEND_URL" &
        fi
    fi

    echo ""
}

################################################################################
# Cleanup Handler
################################################################################

cleanup() {
    echo ""
    print_header "Cleanup"

    # Stop backend
    if [ -f /tmp/embark-backend.pid ]; then
        BACKEND_PID=$(cat /tmp/embark-backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_info "Stopping backend server (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            rm /tmp/embark-backend.pid
            print_success "Backend stopped"
        fi
    fi

    # Stop frontend
    if [ -f /tmp/embark-frontend.pid ]; then
        FRONTEND_PID=$(cat /tmp/embark-frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_info "Stopping frontend server (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            rm /tmp/embark-frontend.pid
            print_success "Frontend stopped"
        fi
    fi

    # Note: We don't stop the database container - it can stay running
    print_info "Database container '$DB_CONTAINER_NAME' left running"
    print_info "To stop it: docker stop $DB_CONTAINER_NAME"
    print_info "To remove it: docker rm -f $DB_CONTAINER_NAME"
}

# Register cleanup handler
trap cleanup EXIT INT TERM

################################################################################
# Main Execution
################################################################################

main() {
    clear

    print_header "Embark Quoting System - Full-Stack Local Development"
    echo ""

    check_prerequisites
    start_database
    setup_backend_env
    setup_frontend_env
    run_migrations
    retrieve_credentials
    start_backend
    start_frontend
    perform_auto_login

    print_header "Development Environment Active"
    print_success "Full stack running!"
    echo ""
    print_info "Frontend:  $FRONTEND_URL"
    print_info "Backend:   $BACKEND_URL/health"
    print_info "Database:  localhost:$DB_PORT ($DB_NAME)"
    echo ""
    print_info "Logs:"
    print_info "  Frontend: /tmp/embark-frontend.log"
    print_info "  Backend:  /tmp/embark-backend.log"
    print_info "  Migrations: /tmp/embark-migration.log"
    echo ""
    print_warning "Press Ctrl+C to stop all services and exit"
    echo ""

    # Keep script running to maintain services
    print_info "Monitoring services..."
    while true; do
        # Check backend
        if [ -f /tmp/embark-backend.pid ]; then
            BACKEND_PID=$(cat /tmp/embark-backend.pid)
            if ! kill -0 $BACKEND_PID 2>/dev/null; then
                print_error "Backend stopped unexpectedly"
                print_info "Check logs: /tmp/embark-backend.log"
                exit 1
            fi
        fi

        # Check frontend
        if [ -f /tmp/embark-frontend.pid ]; then
            FRONTEND_PID=$(cat /tmp/embark-frontend.pid)
            if ! kill -0 $FRONTEND_PID 2>/dev/null; then
                print_error "Frontend stopped unexpectedly"
                print_info "Check logs: /tmp/embark-frontend.log"
                exit 1
            fi
        fi

        sleep 5
    done
}

# Run main function
main
