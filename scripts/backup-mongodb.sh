#!/bin/bash

# MongoDB Backup Script for Food Ordering Platform
# Usage: ./backup-mongodb.sh [database_name]

set -e

# Configuration
DB_NAME=${1:-food_ordering}
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

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

log "Starting MongoDB backup for database: $DB_NAME"

# Check if MongoDB URI is set
if [ -z "$MONGODB_URI" ]; then
    error "MONGODB_URI environment variable is not set"
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Check available disk space
available_space=$(df $BACKUP_DIR | tail -1 | awk '{print $4}')
if [ $available_space -lt 1048576 ]; then # Less than 1GB
    warn "Low disk space available: ${available_space}KB"
fi

# Perform backup
log "Creating backup..."
backup_file="$BACKUP_DIR/mongodb_backup_${DB_NAME}_$DATE"

if mongodump --uri="$MONGODB_URI" --db=$DB_NAME --out=$backup_file; then
    log "Database dump completed successfully"
else
    error "Database dump failed"
fi

# Compress backup
log "Compressing backup..."
if tar -czf "${backup_file}.tar.gz" -C $BACKUP_DIR "mongodb_backup_${DB_NAME}_$DATE"; then
    log "Backup compressed successfully"
    # Remove uncompressed backup
    rm -rf $backup_file
else
    error "Backup compression failed"
fi

# Calculate backup size
backup_size=$(du -h "${backup_file}.tar.gz" | cut -f1)
log "Backup size: $backup_size"

# Upload to S3 (if configured)
if [ -n "$BACKUP_S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
    log "Uploading backup to S3..."
    if aws s3 cp "${backup_file}.tar.gz" "s3://$BACKUP_S3_BUCKET/mongodb-backups/"; then
        log "Backup uploaded to S3 successfully"
    else
        warn "Failed to upload backup to S3"
    fi
fi

# Clean up old backups
log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "mongodb_backup_${DB_NAME}_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# List recent backups
log "Recent backups:"
ls -lh $BACKUP_DIR/mongodb_backup_${DB_NAME}_*.tar.gz 2>/dev/null | tail -5 || log "No backups found"

log "Backup completed successfully: mongodb_backup_${DB_NAME}_$DATE.tar.gz"