#!/bin/bash

# NXZEN HR Employee Onboarding & Attendance Management
# Stop Application Script
# Version: 1.0.0
# Date: 2025-09-03

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping ONDOARD application...${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Kill Node.js processes
print_status "Stopping Node.js processes..."
pkill -f "node.*server.js" 2>/dev/null || print_warning "No backend server found"
pkill -f "npm start" 2>/dev/null || print_warning "No npm processes found"

# Kill specific port processes
print_status "Stopping processes on ports 5001 and 3001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || print_warning "No process on port 5001"
lsof -ti:3001 | xargs kill -9 2>/dev/null || print_warning "No process on port 3001"

# Wait a moment
sleep 2

# Verify processes are stopped
if pgrep -f "node.*server.js" > /dev/null; then
    print_warning "Some Node.js processes may still be running"
else
    print_status "All Node.js processes stopped"
fi

if lsof -i:5001 > /dev/null 2>&1; then
    print_warning "Port 5001 may still be in use"
else
    print_status "Port 5001 is free"
fi

if lsof -i:3001 > /dev/null 2>&1; then
    print_warning "Port 3001 may still be in use"
else
    print_status "Port 3001 is free"
fi

echo -e "${GREEN}🎉 Application stopped successfully!${NC}"
