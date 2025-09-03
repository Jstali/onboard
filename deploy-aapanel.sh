#!/bin/bash

# NXZEN HR Employee Onboarding & Attendance Management
# aaPanel Deployment Script
# Version: 1.0.0
# Date: 2025-09-03

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying ONDOARD to aaPanel...${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
DOMAIN=${1:-"your-domain.com"}
WEB_ROOT="/www/wwwroot/$DOMAIN"
BACKUP_DIR="/www/backup/onboardd"

# Check if domain is provided
if [ "$DOMAIN" = "your-domain.com" ]; then
    print_error "Please provide your domain name as an argument"
    echo "Usage: ./deploy-aapanel.sh your-domain.com"
    exit 1
fi

print_status "Deploying to domain: $DOMAIN"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Create backup directory
print_status "Creating backup directory..."
mkdir -p $BACKUP_DIR

# Backup existing frontend if it exists
if [ -d "$WEB_ROOT" ]; then
    print_status "Backing up existing frontend..."
    cp -r $WEB_ROOT $BACKUP_DIR/frontend_backup_$(date +%Y%m%d_%H%M%S)
fi

# Build frontend for production
print_status "Building frontend for production..."
export NODE_ENV=production
export REACT_APP_API_URL=/api

cd frontend
npm install --silent
npm run build
cd ..

# Deploy frontend to aaPanel
print_status "Deploying frontend to aaPanel..."
mkdir -p $WEB_ROOT
cp -r frontend/build/* $WEB_ROOT/

# Set proper permissions
chown -R www:www $WEB_ROOT
chmod -R 755 $WEB_ROOT

# Deploy Docker containers
print_status "Starting Docker containers..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Wait for containers to start
print_status "Waiting for containers to start..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    print_status "Docker containers are running"
else
    print_error "Docker containers failed to start"
    docker-compose logs
    exit 1
fi

# Test API connection
print_status "Testing API connection..."
if curl -s http://localhost:5001/api/attendance/settings > /dev/null; then
    print_status "API is accessible"
else
    print_warning "API may still be starting up"
fi

# Create NGINX configuration
print_status "Creating NGINX configuration..."
NGINX_CONF="/www/server/panel/vhost/nginx/$DOMAIN.conf"

# Create NGINX config with proper domain
cat > nginx-aapanel.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Frontend static files
    location / {
        root $WEB_ROOT;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy to backend Docker container
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
            add_header Access-Control-Max-Age 1728000 always;
            add_header Content-Type "text/plain; charset=utf-8" always;
            add_header Content-Length 0 always;
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root $WEB_ROOT;
    }

    # Security: Hide server info
    server_tokens off;
}
EOF

print_status "NGINX configuration created: nginx-aapanel.conf"
print_warning "Please manually copy this configuration to aaPanel NGINX settings"

# Display deployment summary
echo -e "${BLUE}"
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Domain: $DOMAIN"
echo "   Frontend: $WEB_ROOT"
echo "   Backend: Docker container (port 5001)"
echo "   Database: Docker container (PostgreSQL)"
echo ""
echo "🔑 Default Login Credentials:"
echo "   HR Admin: hr@nxzen.com / test123"
echo "   Test HR: testhr@nxzen.com / test123"
echo "   Manager: manager@company.com / test123"
echo "   Test Employee: test@test.com / test123"
echo ""
echo "🛠️  Next Steps:"
echo "   1. Copy nginx-aapanel.conf to aaPanel NGINX settings"
echo "   2. Reload NGINX in aaPanel"
echo "   3. Test the application at http://$DOMAIN"
echo "   4. Configure SSL certificate if needed"
echo ""
echo "📁 Files:"
echo "   Frontend: $WEB_ROOT"
echo "   NGINX Config: nginx-aapanel.conf"
echo "   Docker Compose: docker-compose.yml"
echo -e "${NC}"

print_status "Deployment completed! 🚀"
