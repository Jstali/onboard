# NXZEN Employee Management System - Production Deployment

## 🚀 Server Information

- **Server IP**: 149.102.158.71
- **Database**: PostgreSQL (External)
- **Database Name**: onboardxdb
- **Database User**: postgres
- **Database Password**: MySecurePass#2025
- **Database Host**: localhost
- **Database Port**: 5432

## 📋 Prerequisites

### Server Requirements

- Ubuntu 20.04+ or CentOS 8+
- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL 13+ (External)
- 4GB RAM minimum
- 20GB disk space

### Software Installation

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install PostgreSQL client tools
sudo apt-get update
sudo apt-get install postgresql-client
```

## 🗄️ Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres

# Create database
CREATE DATABASE onboardxdb;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE onboardxdb TO postgres;

# Exit
\q
```

### 2. Initialize Database Tables

```bash
# Run the database setup script
cd /path/to/onboard/backend
./database_tables.sh
```

## 🐳 Deployment Options

### Option 1: External Database (Recommended)

Use your existing PostgreSQL database on localhost.

```bash
# Deploy with external database
./deploy-external-db.sh
```

### Option 2: Docker Database

Use PostgreSQL container (for testing only).

```bash
# Deploy with Docker database
./deploy.sh
```

## 📁 File Structure

```
onboard/
├── backend/
│   ├── Dockerfile
│   ├── production.env
│   └── database_tables.sh
├── frontend/
│   ├── Dockerfile
│   └── nginx.conf
├── scripts/
│   └── backup.sh
├── docker-compose.yml
├── docker-compose.prod.yml
├── docker-compose.external-db.yml
├── production.env
├── deploy.sh
├── deploy-external-db.sh
└── start.sh
```

## 🔧 Configuration Files

### Environment Variables

- `production.env` - Main production configuration
- `backend/production.env` - Backend-specific configuration

### Docker Compose Files

- `docker-compose.yml` - Development setup
- `docker-compose.prod.yml` - Production with Docker database
- `docker-compose.external-db.yml` - Production with external database

## 🚀 Deployment Commands

### Quick Start (External Database)

```bash
# Clone repository
git clone <repository-url>
cd onboard

# Make scripts executable
chmod +x *.sh scripts/*.sh

# Deploy with external database
./deploy-external-db.sh
```

### Manual Deployment

```bash
# Stop existing services
docker-compose -f docker-compose.external-db.yml down

# Build and start services
docker-compose -f docker-compose.external-db.yml up -d --build

# Check status
docker-compose -f docker-compose.external-db.yml ps
```

## 📊 Service Management

### View Logs

```bash
# All services
docker-compose -f docker-compose.external-db.yml logs -f

# Specific service
docker-compose -f docker-compose.external-db.yml logs -f backend
docker-compose -f docker-compose.external-db.yml logs -f frontend
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.external-db.yml restart

# Restart specific service
docker-compose -f docker-compose.external-db.yml restart backend
```

### Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.external-db.yml down

# Stop and remove volumes
docker-compose -f docker-compose.external-db.yml down -v
```

## 🔍 Health Checks

### Application URLs

- **Frontend**: http://149.102.158.71:2025
- **API**: http://149.102.158.71:2025/api
- **Health Check**: http://149.102.158.71:2025/health

### Manual Health Checks

```bash
# Check API health
curl -f http://149.102.158.71:2025/api/health

# Check frontend
curl -f http://149.102.158.71:2025/health

# Check database connection
psql -h localhost -U postgres -d onboardxdb -c "SELECT 1;"
```

## 💾 Backup and Recovery

### Automated Backup

```bash
# Run backup script
./scripts/backup.sh

# List backups
./scripts/backup.sh list

# Cleanup old backups
./scripts/backup.sh cleanup
```

### Manual Backup

```bash
# Database backup
pg_dump -h localhost -U postgres -d onboardxdb > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -h localhost -U postgres -d onboardxdb < backup_file.sql
```

## 🔒 Security Configuration

### Firewall Setup

```bash
# Allow HTTP and HTTPS
sudo ufw allow 2025
sudo ufw allow 2026

# Allow SSH
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

### SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d 149.102.158.71

# Update nginx configuration for SSL
# (Manual configuration required)
```

## 📈 Monitoring

### Resource Usage

```bash
# Docker stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### Log Monitoring

```bash
# Real-time logs
docker-compose -f docker-compose.external-db.yml logs -f --tail=100

# Log files
tail -f /var/lib/docker/containers/*/logs/*.log
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check database status
sudo systemctl status postgresql

# Check database connectivity
psql -h localhost -U postgres -d onboardxdb

# Check Docker network
docker network ls
```

#### Services Not Starting

```bash
# Check service logs
docker-compose -f docker-compose.external-db.yml logs

# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

#### Port Conflicts

```bash
# Check port usage
sudo netstat -tulpn | grep :2025
sudo netstat -tulpn | grep :2026

# Kill conflicting processes
sudo kill -9 <PID>
```

### Reset Everything

```bash
# Stop all services
docker-compose -f docker-compose.external-db.yml down -v

# Remove all containers
docker container prune -f

# Remove all images
docker image prune -a -f

# Remove all volumes
docker volume prune -f

# Restart deployment
./deploy-external-db.sh
```

## 📞 Support

### Log Files Location

- **Application Logs**: `/var/lib/docker/containers/*/logs/`
- **Nginx Logs**: Inside frontend container
- **Database Logs**: PostgreSQL system logs

### Useful Commands

```bash
# Get container IP
docker inspect <container_name> | grep IPAddress

# Execute commands in container
docker exec -it <container_name> /bin/bash

# Copy files from container
docker cp <container_name>:/path/to/file /local/path
```

## 🔄 Updates

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.external-db.yml up -d --build

# Or use deployment script
./deploy-external-db.sh
```

### Database Updates

```bash
# Run migration scripts
psql -h localhost -U postgres -d onboardxdb -f migration.sql
```

---

## 📝 Notes

- Always backup before major updates
- Monitor disk space regularly
- Keep Docker and system packages updated
- Test deployments in staging environment first
- Document any custom configurations

For additional support, check the application logs and Docker documentation.
