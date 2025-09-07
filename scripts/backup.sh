#!/bin/bash

# =============================================================================
# NXZEN EMPLOYEE MANAGEMENT SYSTEM - BACKUP SCRIPT
# =============================================================================
# Automated backup script for production database and files
# =============================================================================

set -e

# Configuration
BACKUP_DIR="/app/backups"
DB_NAME="onboardxdb"
DB_USER="postgres"
DB_HOST="host.docker.internal"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create backup directory
create_backup_dir() {
    local backup_path="$BACKUP_DIR/$TIMESTAMP"
    mkdir -p "$backup_path"
    echo "$backup_path"
}

# Function to backup database
backup_database() {
    local backup_path=$1
    
    print_status "Starting database backup..."
    
    # Create database dump
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="$backup_path/database.dump"
    
    # Create SQL dump as well
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --file="$backup_path/database.sql"
    
    # Get database size
    local db_size=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
    
    print_success "Database backup completed (Size: $db_size)"
}

# Function to backup uploads
backup_uploads() {
    local backup_path=$1
    
    print_status "Starting uploads backup..."
    
    if [ -d "/app/uploads" ]; then
        cp -r /app/uploads "$backup_path/"
        print_success "Uploads backup completed"
    else
        print_warning "No uploads directory found"
    fi
}

# Function to backup logs
backup_logs() {
    local backup_path=$1
    
    print_status "Starting logs backup..."
    
    if [ -d "/app/logs" ]; then
        # Only backup recent logs (last 7 days)
        find /app/logs -name "*.log" -mtime -7 -exec cp {} "$backup_path/" \;
        print_success "Logs backup completed"
    else
        print_warning "No logs directory found"
    fi
}

# Function to create backup metadata
create_metadata() {
    local backup_path=$1
    
    print_status "Creating backup metadata..."
    
    cat > "$backup_path/backup_info.txt" << EOF
Backup Information
==================
Timestamp: $TIMESTAMP
Date: $(date)
Database: $DB_NAME
Database Size: $(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
Server: $(hostname)
Docker Container: $(hostname)
Backup Type: Full Backup
Retention: $RETENTION_DAYS days

Services Status:
$(docker-compose ps 2>/dev/null || echo "Docker compose not available")

Disk Usage:
$(df -h /app 2>/dev/null || echo "Disk usage not available")
EOF
    
    print_success "Backup metadata created"
}

# Function to compress backup
compress_backup() {
    local backup_path=$1
    
    print_status "Compressing backup..."
    
    cd "$BACKUP_DIR"
    tar -czf "${TIMESTAMP}.tar.gz" "$TIMESTAMP"
    rm -rf "$TIMESTAMP"
    
    local compressed_size=$(du -h "${TIMESTAMP}.tar.gz" | cut -f1)
    print_success "Backup compressed (Size: $compressed_size)"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
    
    print_success "Old backups cleaned up"
}

# Function to verify backup
verify_backup() {
    local backup_file="$BACKUP_DIR/${TIMESTAMP}.tar.gz"
    
    print_status "Verifying backup..."
    
    if [ -f "$backup_file" ]; then
        # Test if tar file is valid
        if tar -tzf "$backup_file" > /dev/null 2>&1; then
            print_success "Backup verification successful"
            return 0
        else
            print_error "Backup verification failed - corrupted archive"
            return 1
        fi
    else
        print_error "Backup file not found"
        return 1
    fi
}

# Function to send notification (if configured)
send_notification() {
    local status=$1
    local message=$2
    
    # This can be extended to send email notifications
    # or integrate with monitoring systems
    print_status "Backup $status: $message"
}

# Main backup function
main() {
    print_status "Starting NXZEN HRMS backup process..."
    print_status "Timestamp: $TIMESTAMP"
    
    # Create backup directory
    local backup_path=$(create_backup_dir)
    
    # Perform backups
    backup_database "$backup_path"
    backup_uploads "$backup_path"
    backup_logs "$backup_path"
    create_metadata "$backup_path"
    
    # Compress backup
    compress_backup "$backup_path"
    
    # Verify backup
    if verify_backup; then
        print_success "Backup completed successfully!"
        send_notification "SUCCESS" "Backup completed successfully at $TIMESTAMP"
    else
        print_error "Backup verification failed!"
        send_notification "FAILED" "Backup verification failed at $TIMESTAMP"
        exit 1
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    print_success "Backup process completed!"
}

# Handle script arguments
case "${1:-}" in
    "verify")
        verify_backup
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "list")
        ls -la "$BACKUP_DIR"
        ;;
    *)
        main
        ;;
esac
