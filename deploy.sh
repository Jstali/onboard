#!/bin/bash

# NXZEN HR Employee Onboarding & Attendance Management
# Deployment Script
# Version: 1.0.0
# Date: 2025-09-03

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ONDOARD"
BACKEND_PORT=5001
FRONTEND_PORT=3001
DB_NAME="onboardd"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT=5432

echo -e "${BLUE}🚀 Starting deployment of ${PROJECT_NAME}...${NC}"

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client is not installed. Please install PostgreSQL client first."
        exit 1
    fi
    
    print_status "All dependencies are installed"
}

# Check database connection
check_database() {
    print_status "Checking database connection..."
    
    if ! psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
        print_error "Cannot connect to database. Please ensure PostgreSQL is running and database '$DB_NAME' exists."
        exit 1
    fi
    
    print_status "Database connection successful"
}

# Install backend dependencies
install_backend() {
    print_status "Installing backend dependencies..."
    
    cd backend
    npm install
    cd ..
    
    print_status "Backend dependencies installed"
}

# Install frontend dependencies
install_frontend() {
    print_status "Installing frontend dependencies..."
    
    cd frontend
    npm install
    cd ..
    
    print_status "Frontend dependencies installed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Create migration_log table if it doesn't exist
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    CREATE TABLE IF NOT EXISTS migration_log (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        details TEXT
    );" 2>/dev/null || true
    
    # Run migrations
    for migration in migrations/*.sql; do
        if [ -f "$migration" ]; then
            print_status "Running migration: $(basename $migration)"
            psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f "$migration" || {
                print_warning "Migration $(basename $migration) failed or already applied"
            }
        fi
    done
    
    print_status "Database migrations completed"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    npm run build
    cd ..
    
    print_status "Frontend built successfully"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Kill existing processes
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true
    
    # Start backend
    print_status "Starting backend server on port $BACKEND_PORT..."
    cd backend
    nohup npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 5
    
    # Check if backend is running
    if curl -s http://localhost:$BACKEND_PORT/api/attendance/settings > /dev/null 2>&1; then
        print_status "Backend server started successfully"
    else
        print_error "Backend server failed to start"
        exit 1
    fi
    
    # Start frontend
    print_status "Starting frontend server on port $FRONTEND_PORT..."
    cd frontend
    nohup npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    sleep 10
    
    # Check if frontend is running
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        print_status "Frontend server started successfully"
    else
        print_warning "Frontend server may still be starting up"
    fi
    
    print_status "Services started successfully"
}

# Display deployment info
show_deployment_info() {
    echo -e "${BLUE}"
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Deployment Information:"
    echo "   Project: $PROJECT_NAME"
    echo "   Backend: http://localhost:$BACKEND_PORT"
    echo "   Frontend: http://localhost:$FRONTEND_PORT"
    echo "   Database: $DB_NAME"
    echo ""
    echo "🔑 Default Login Credentials:"
    echo "   HR Admin: hr@nxzen.com / test123"
    echo "   Test HR: testhr@nxzen.com / test123"
    echo "   Manager: manager@company.com / test123"
    echo "   Test Employee: test@test.com / test123"
    echo ""
    echo "📁 Log Files:"
    echo "   Backend: ./backend.log"
    echo "   Frontend: ./frontend.log"
    echo ""
    echo "🛠️  Management Commands:"
    echo "   Stop all services: ./stop.sh"
    echo "   Restart services: ./restart.sh"
    echo "   View logs: tail -f backend.log frontend.log"
    echo -e "${NC}"
}

# Main deployment process
main() {
    echo -e "${BLUE}🚀 Starting deployment of ${PROJECT_NAME}...${NC}"
    
    check_dependencies
    check_database
    install_backend
    install_frontend
    run_migrations
    build_frontend
    start_services
    show_deployment_info
}

# Run main function
main "$@"
