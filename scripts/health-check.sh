#!/bin/bash

# Health Check Script for Food Ordering Platform
# Usage: ./health-check.sh [environment]

set -e

ENVIRONMENT=${1:-production}
BASE_URL=${2:-http://localhost}
BACKEND_PORT=${3:-5000}
FRONTEND_PORT=${4:-80}

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
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Health check function
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    log "Checking $service_name at $url"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        success "$service_name is healthy (HTTP $response)"
        return 0
    else
        error "$service_name is unhealthy (HTTP $response)"
        return 1
    fi
}

# Check service availability
check_service_availability() {
    local service_name=$1
    local host=$2
    local port=$3
    
    log "Checking $service_name connectivity at $host:$port"
    
    if timeout 5 bash -c "</dev/tcp/$host/$port"; then
        success "$service_name is reachable"
        return 0
    else
        error "$service_name is not reachable"
        return 1
    fi
}

# Check Docker containers
check_docker_containers() {
    log "Checking Docker containers status..."
    
    if [ "$ENVIRONMENT" = "development" ]; then
        compose_file="docker-compose.yml"
    else
        compose_file="docker-compose.prod.yml"
    fi
    
    if [ -f "$compose_file" ]; then
        containers=$(docker-compose -f "$compose_file" ps -q)
        
        if [ -z "$containers" ]; then
            error "No containers are running"
            return 1
        fi
        
        for container in $containers; do
            status=$(docker inspect --format='{{.State.Status}}' "$container")
            name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
            
            if [ "$status" = "running" ]; then
                success "Container $name is running"
            else
                error "Container $name is $status"
            fi
        done
    else
        warn "Docker compose file not found, skipping container check"
    fi
}

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    
    # Check MongoDB
    if command -v mongo >/dev/null 2>&1; then
        if mongo --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            success "MongoDB is accessible"
        else
            error "MongoDB is not accessible"
        fi
    else
        warn "MongoDB client not available, skipping direct database check"
    fi
    
    # Check Redis
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli ping >/dev/null 2>&1; then
            success "Redis is accessible"
        else
            error "Redis is not accessible"
        fi
    else
        warn "Redis client not available, skipping direct Redis check"
    fi
}

# Main health check
main() {
    log "Starting health check for environment: $ENVIRONMENT"
    
    local failed_checks=0
    
    # Check Docker containers
    if ! check_docker_containers; then
        ((failed_checks++))
    fi
    
    # Check service connectivity
    if ! check_service_availability "Backend" "localhost" "$BACKEND_PORT"; then
        ((failed_checks++))
    fi
    
    if ! check_service_availability "Frontend" "localhost" "$FRONTEND_PORT"; then
        ((failed_checks++))
    fi
    
    # Check HTTP endpoints
    if ! check_service "Backend Health" "$BASE_URL:$BACKEND_PORT/api/health"; then
        ((failed_checks++))
    fi
    
    if ! check_service "Frontend" "$BASE_URL:$FRONTEND_PORT/health"; then
        ((failed_checks++))
    fi
    
    # Check API endpoints
    if ! check_service "API Categories" "$BASE_URL:$BACKEND_PORT/api/inventory/categories"; then
        ((failed_checks++))
    fi
    
    # Check database connectivity
    if ! check_database; then
        ((failed_checks++))
    fi
    
    # Summary
    log "Health check completed"
    
    if [ $failed_checks -eq 0 ]; then
        success "All health checks passed!"
        exit 0
    else
        error "$failed_checks health check(s) failed"
        exit 1
    fi
}

# Run main function
main