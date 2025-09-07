#!/bin/bash

# =============================================================================
# NXZEN EMPLOYEE MANAGEMENT SYSTEM - STARTUP SCRIPT
# =============================================================================
# Quick startup script for development and testing
# =============================================================================

set -e

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to start services
start_services() {
    print_status "Starting NXZEN HRMS services..."
    
    # Use development compose file for local development
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d --build
    else
        print_error "docker-compose.yml not found"
        exit 1
    fi
    
    print_success "Services started successfully"
}

# Function to wait for services
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:2025/api/health > /dev/null 2>&1; then
            print_success "Backend API is ready"
            break
        fi
        
        print_warning "Waiting for backend API... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Backend API failed to start within expected time"
        return 1
    fi
    
    # Wait for frontend
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:2025/health > /dev/null 2>&1; then
            print_success "Frontend is ready"
            break
        fi
        
        print_warning "Waiting for frontend... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Frontend failed to start within expected time"
        return 1
    fi
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo ""
    docker-compose ps
    echo ""
    print_status "Application URLs:"
    echo "  Frontend: http://localhost:2025"
    echo "  API: http://localhost:2025/api"
    echo "  Health Check: http://localhost:2025/health"
    echo ""
    print_status "Useful Commands:"
    echo "  View logs: docker-compose logs -f [service_name]"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart [service_name]"
}

# Function to show logs
show_logs() {
    print_status "Showing recent logs..."
    docker-compose logs --tail=50
}

# Main function
main() {
    echo "============================================================================="
    echo "NXZEN EMPLOYEE MANAGEMENT SYSTEM - QUICK START"
    echo "============================================================================="
    echo ""
    
    # Check Docker
    check_docker
    
    # Start services
    start_services
    
    # Wait for services
    if wait_for_services; then
        print_success "All services are ready!"
        echo ""
        show_status
        echo ""
        print_success "Your NXZEN Employee Management System is now running!"
        print_status "Access your application at: http://localhost:2025"
    else
        print_error "Some services failed to start"
        echo ""
        show_logs
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        print_status "Stopping services..."
        docker-compose down
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose restart
        print_success "Services restarted"
        ;;
    "build")
        print_status "Building and starting services..."
        docker-compose up -d --build
        print_success "Services built and started"
        ;;
    *)
        main
        ;;
esac
