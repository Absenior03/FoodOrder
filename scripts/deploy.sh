#!/bin/bash

# Food Ordering Platform Deployment Script
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh production v1.0.0

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
PROJECT_NAME="food-ordering-platform"
DOCKER_REGISTRY="your-registry.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    error "Invalid environment. Use: development, staging, or production"
fi

log "Starting deployment for environment: $ENVIRONMENT, version: $VERSION"

# Check if required files exist
if [ ! -f ".env.$ENVIRONMENT" ]; then
    error "Environment file .env.$ENVIRONMENT not found"
fi

if [ ! -f "docker-compose.prod.yml" ] && [ "$ENVIRONMENT" != "development" ]; then
    error "Production docker-compose file not found"
fi

# Load environment variables
log "Loading environment variables for $ENVIRONMENT"
export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running"
fi

# Check if required environment variables are set
required_vars=("MONGODB_URI" "JWT_SECRET" "CORS_ORIGIN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set"
    fi
done

# Run tests
if [ "$ENVIRONMENT" = "production" ]; then
    log "Running tests before production deployment..."
    npm test || error "Tests failed"
fi

# Build application
log "Building application for $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "development" ]; then
    npm run build
else
    npm run build:prod
fi

# Build Docker images
log "Building Docker images..."
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose build
else
    docker-compose -f docker-compose.prod.yml build
fi

# Tag images with version
if [ "$VERSION" != "latest" ]; then
    log "Tagging images with version $VERSION"
    docker tag ${PROJECT_NAME}_backend:latest ${PROJECT_NAME}_backend:$VERSION
    docker tag ${PROJECT_NAME}_frontend:latest ${PROJECT_NAME}_frontend:$VERSION
fi

# Push to registry (if configured)
if [ -n "$DOCKER_REGISTRY" ] && [ "$ENVIRONMENT" = "production" ]; then
    log "Pushing images to registry..."
    docker tag ${PROJECT_NAME}_backend:latest $DOCKER_REGISTRY/${PROJECT_NAME}_backend:$VERSION
    docker tag ${PROJECT_NAME}_frontend:latest $DOCKER_REGISTRY/${PROJECT_NAME}_frontend:$VERSION
    docker push $DOCKER_REGISTRY/${PROJECT_NAME}_backend:$VERSION
    docker push $DOCKER_REGISTRY/${PROJECT_NAME}_frontend:$VERSION
fi

# Create backup before deployment (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    log "Creating backup before deployment..."
    ./scripts/backup-mongodb.sh || warn "Backup failed, continuing with deployment"
fi

# Deploy application
log "Deploying application..."
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose up -d
else
    docker-compose -f docker-compose.prod.yml up -d
fi

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Health check
log "Performing health checks..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log "Backend health check passed"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        error "Backend health check failed after $max_attempts attempts"
    fi
    
    log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
    sleep 10
    ((attempt++))
done

# Frontend health check
if curl -f http://localhost:80/health > /dev/null 2>&1; then
    log "Frontend health check passed"
else
    warn "Frontend health check failed"
fi

# Post-deployment tasks
log "Running post-deployment tasks..."

# Seed database if needed (development/staging only)
if [ "$ENVIRONMENT" != "production" ]; then
    log "Seeding database with sample data..."
    npm run seed:inventory || warn "Database seeding failed"
fi

# Clean up old Docker images
log "Cleaning up old Docker images..."
docker image prune -f

log "Deployment completed successfully!"
log "Application is running at:"
log "  Frontend: http://localhost:80"
log "  Backend: http://localhost:5000"
log "  API Health: http://localhost:5000/api/health"

# Display running containers
log "Running containers:"
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose ps
else
    docker-compose -f docker-compose.prod.yml ps
fi