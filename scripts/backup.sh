#!/bin/sh
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="onboardxdb_backup_${DATE}.sql"

echo "Starting database backup: ${FILENAME}"
# Connect to Docker PostgreSQL container (internal network)
pg_dump -h nxzen_postgres_prod -p 5432 -U postgres -d onboardxdb > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 7 days of backups
find ${BACKUP_DIR} -name "onboardxdb_backup_*.sql" -mtime +7 -delete

echo "Backup completed: ${FILENAME}"
