#!/bin/bash

# NXZEN HR Employee Onboarding & Attendance Management
# Restart Application Script
# Version: 1.0.0
# Date: 2025-09-03

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Restarting ONDOARD application...${NC}"

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

# Stop the application first
print_status "Stopping existing services..."
./stop.sh

# Wait a moment
sleep 3

# Start the application
print_status "Starting services..."
./deploy.sh

echo -e "${GREEN}🎉 Application restarted successfully!${NC}"
