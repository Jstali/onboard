# NXZEN HR System - aaPanel Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the NXZEN HR Employee Onboarding & Attendance Management system on aaPanel using Docker containers for the backend and PostgreSQL, with NGINX serving the React frontend.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │   aaPanel       │    │   Docker        │
│                 │    │   NGINX         │    │   Containers    │
│                 │────│                 │────│                 │
│                 │    │   • Frontend    │    │   • Backend     │
│                 │    │   • Static Files│    │   • PostgreSQL  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### aaPanel Requirements

- **aaPanel** installed and configured
- **Docker** and **Docker Compose** installed
- **Node.js** (for building frontend)
- **Git** (for cloning repository)

### System Requirements

- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 5GB free space
- **OS**: Linux (Ubuntu/CentOS recommended)

## 🚀 Deployment Steps

### Step 1: Prepare the Application

1. **Clone or upload the project to your server**

   ```bash
   git clone <your-repository-url>
   cd ONDOARD
   ```

2. **Build the frontend for production**
   ```bash
   ./build-frontend.sh
   ```

### Step 2: Configure aaPanel

1. **Create a new website in aaPanel**

   - Log into aaPanel
   - Go to "Website" → "Add Site"
   - Enter your domain name
   - Choose "Static" as the site type

2. **Upload frontend files**

   ```bash
   # Copy built frontend to aaPanel web directory
   cp -r frontend/build/* /www/wwwroot/your-domain.com/
   ```

3. **Configure NGINX**
   - In aaPanel, go to "Website" → "Settings" → "NGINX"
   - Replace the default configuration with the content from `nginx.conf`
   - Update the `server_name` and `root` paths for your domain
   - Save and reload NGINX

### Step 3: Deploy Docker Containers

1. **Start the backend and database containers**

   ```bash
   docker-compose up -d
   ```

2. **Verify containers are running**

   ```bash
   docker-compose ps
   ```

3. **Check container logs**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f postgres
   ```

### Step 4: Database Setup

1. **Run database migrations**

   ```bash
   # Connect to the PostgreSQL container
   docker exec -it onboardd-postgres psql -U postgres -d onboardd

   # Or run migrations from host
   psql -h localhost -U postgres -d onboardd -f migrations/002_cleanup_managers.sql
   ```

2. **Verify database connection**
   ```bash
   curl http://localhost:5001/api/attendance/settings
   ```

## 🔧 Configuration Files

### Frontend Configuration (`frontend/src/config/api.js`)

```javascript
// Production environment uses relative paths
production: {
    baseURL: "/api", // Relative path for NGINX proxy
    timeout: 15000,
}
```

### Docker Compose (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: onboardd
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Stali

  backend:
    build: ./backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      # ... other environment variables
```

### NGINX Configuration (`nginx.conf`)

```nginx
# Frontend static files
location / {
    root /www/wwwroot/your-domain.com/frontend/build;
    try_files $uri $uri/ /index.html;
}

# API proxy to Docker backend
location /api/ {
    proxy_pass http://localhost:5001/api/;
    # ... proxy settings
}
```

## 🔑 Default Login Credentials

| Role              | Email               | Password |
| ----------------- | ------------------- | -------- |
| **HR Admin**      | hr@nxzen.com        | test123  |
| **Test HR**       | testhr@nxzen.com    | test123  |
| **Manager**       | manager@company.com | test123  |
| **Test Employee** | test@test.com       | test123  |

## 🛠️ Management Commands

### Docker Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Update and rebuild
docker-compose up -d --build
```

### Frontend Updates

```bash
# Build new frontend
./build-frontend.sh

# Copy to aaPanel
cp -r frontend/build/* /www/wwwroot/your-domain.com/
```

### Database Management

```bash
# Connect to database
docker exec -it onboardd-postgres psql -U postgres -d onboardd

# Backup database
docker exec onboardd-postgres pg_dump -U postgres onboardd > backup.sql

# Restore database
docker exec -i onboardd-postgres psql -U postgres -d onboardd < backup.sql
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Frontend Not Loading

```bash
# Check NGINX configuration
nginx -t

# Check file permissions
ls -la /www/wwwroot/your-domain.com/

# Check NGINX logs
tail -f /www/server/nginx/logs/error.log
```

#### 2. API Calls Failing

```bash
# Check if backend is running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Test API directly
curl http://localhost:5001/api/attendance/settings
```

#### 3. Database Connection Issues

```bash
# Check PostgreSQL container
docker-compose logs postgres

# Test database connection
docker exec -it onboardd-postgres psql -U postgres -d onboardd -c "SELECT 1;"
```

#### 4. CORS Issues

- Ensure NGINX proxy is configured correctly
- Check that API calls use relative paths (`/api/`)
- Verify CORS headers in NGINX configuration

### Log Locations

- **aaPanel NGINX**: `/www/server/nginx/logs/`
- **Docker Backend**: `docker-compose logs backend`
- **Docker PostgreSQL**: `docker-compose logs postgres`
- **Application Logs**: `backend/logs/` (mounted volume)

## 🔒 Security Considerations

### Production Security

1. **Change default passwords**

   ```bash
   # Update database password
   docker-compose down
   # Edit docker-compose.yml with new password
   docker-compose up -d
   ```

2. **Use HTTPS**

   - Configure SSL certificate in aaPanel
   - Update NGINX configuration for HTTPS

3. **Environment Variables**

   - Store sensitive data in environment variables
   - Use Docker secrets for production

4. **Firewall Configuration**
   ```bash
   # Only expose necessary ports
   ufw allow 80
   ufw allow 443
   ufw allow 22
   ```

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl http://your-domain.com/health

# API health
curl http://your-domain.com/api/attendance/settings

# Container health
docker-compose ps
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# Database performance
docker exec -it onboardd-postgres psql -U postgres -d onboardd -c "SELECT * FROM pg_stat_activity;"
```

## 🔄 Updates and Maintenance

### Application Updates

1. **Pull latest code**

   ```bash
   git pull origin main
   ```

2. **Rebuild frontend**

   ```bash
   ./build-frontend.sh
   cp -r frontend/build/* /www/wwwroot/your-domain.com/
   ```

3. **Rebuild and restart containers**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Database Backups

```bash
# Create backup
docker exec onboardd-postgres pg_dump -U postgres onboardd > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i onboardd-postgres psql -U postgres -d onboardd < backup_file.sql
```

## 📞 Support

For deployment issues:

1. Check the logs for error messages
2. Verify all services are running
3. Test API endpoints directly
4. Check NGINX configuration syntax

---

**Version**: 1.0.0  
**Last Updated**: 2025-09-03  
**Author**: System Administrator
