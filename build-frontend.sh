#!/bin/bash

# NXZEN HR Employee Onboarding & Attendance Management
# Frontend Production Build Script
# Version: 1.0.0
# Date: 2025-09-03

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Building ONDOARD frontend for production...${NC}"

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

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    print_error "Frontend package.json not found. Please run this script from the project root."
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Clean previous build
print_status "Cleaning previous build..."
rm -rf build
rm -rf node_modules/.cache

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
else
    print_status "Dependencies already installed"
fi

# Set production environment
export NODE_ENV=production
export REACT_APP_API_URL=/api

print_status "Building for production environment..."
print_status "API URL will be: $REACT_APP_API_URL"

# Build the application
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    print_status "Frontend build completed successfully!"
    
    # Show build info
    echo -e "${BLUE}"
    echo "📊 Build Information:"
    echo "   Build directory: frontend/build"
    echo "   Environment: production"
    echo "   API URL: /api (relative path for NGINX proxy)"
    echo ""
    echo "📁 Build contents:"
    ls -la build/
    echo -e "${NC}"
    
    # Check build size
    BUILD_SIZE=$(du -sh build/ | cut -f1)
    print_status "Build size: $BUILD_SIZE"
    
    # Verify critical files exist
    if [ -f "build/index.html" ]; then
        print_status "index.html ✓"
    else
        print_error "index.html not found in build directory"
        exit 1
    fi
    
    if [ -d "build/static" ]; then
        print_status "Static assets ✓"
    else
        print_error "Static assets not found in build directory"
        exit 1
    fi
    
else
    print_error "Frontend build failed!"
    exit 1
fi

# Return to root directory
cd ..

print_status "Frontend is ready for deployment!"
echo -e "${BLUE}"
echo "🚀 Next steps:"
echo "   1. Copy frontend/build/ to your aaPanel web directory"
echo "   2. Configure NGINX proxy for /api/ endpoints"
echo "   3. Start Docker containers with: docker-compose up -d"
echo -e "${NC}"
