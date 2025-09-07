#!/bin/bash

# =============================================================================
# NXZEN EMPLOYEE MANAGEMENT SYSTEM - EXTERNAL DATABASE DEPLOYMENT SCRIPT
# =============================================================================
# Production deployment script for server 149.102.158.71 with external database
# Database: onboardxdb on localhost:5432
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="149.102.158.71"
APP_NAME="nxzen-hrms"
DOCKER_COMPOSE_FILE="docker-compose.external-db.yml"
BACKUP_DIR="/opt/backups/nxzen-hrms"

# Database Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="onboardxdb"
DB_USER="postgres"
DB_PASSWORD="MySecurePass#2025"

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

# Function to check database connection
check_database() {
    print_status "Checking database connection..."
    
    if command -v psql &> /dev/null; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" > /dev/null 2>&1; then
            print_success "Database connection successful"
        else
            print_error "Cannot connect to database. Please check:"
            echo "  - Database is running on $DB_HOST:$DB_PORT"
            echo "  - Database '$DB_NAME' exists"
            echo "  - User '$DB_USER' has access"
            echo "  - Password is correct"
            exit 1
        fi
    else
        print_warning "psql not found. Skipping database connection test."
        print_warning "Please ensure database is accessible at $DB_HOST:$DB_PORT"
    fi
}

# Function to check if database tables exist
check_database_tables() {
    print_status "Checking if database tables exist..."
    
    if command -v psql &> /dev/null; then
        local table_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
        
        if [ "$table_count" -gt 0 ]; then
            print_success "Database tables exist ($table_count tables found)"
        else
            print_warning "No tables found in database. You may need to run the database setup script."
            read -p "Do you want to continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_warning "psql not found. Skipping table check."
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then
        print_warning "This script should be run as root or with sudo for proper permissions."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success "Prerequisites check completed"
}

# Function to create backup
create_backup() {
    print_status "Creating backup of current deployment..."
    
    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_path="$BACKUP_DIR/$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup database
    if command -v pg_dump &> /dev/null; then
        print_status "Backing up database..."
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_path/database.sql"
        print_success "Database backup created"
    else
        print_warning "pg_dump not found. Skipping database backup."
    fi
    
    # Backup uploads
    if [ -d "./backend/uploads" ]; then
        print_status "Backing up uploads..."
        cp -r ./backend/uploads "$backup_path/"
        print_success "Uploads backup created"
    fi
    
    # Backup configuration
    print_status "Backing up configuration..."
    cp docker-compose.external-db.yml "$backup_path/"
    cp production.env "$backup_path/"
    print_success "Configuration backup created"
    
    print_success "Backup created at: $backup_path"
}

# Function to stop existing services
stop_services() {
    print_status "Stopping existing services..."
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
        print_success "Existing services stopped"
    else
        print_warning "No existing docker-compose file found"
    fi
}

# Function to clean up old images
cleanup_images() {
    print_status "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old versions of our images
    docker images | grep "$APP_NAME" | awk '{print $3}' | xargs -r docker rmi -f
    
    print_success "Docker images cleaned up"
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Build and start services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d --build --force-recreate
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "unhealthy"; then
            print_warning "Some services are still starting... (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        else
            print_success "All services are healthy"
            break
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Services failed to become healthy within expected time"
        print_status "Checking service logs..."
        docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=50
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if services are running
    local services=("redis" "backend" "frontend")
    for service in "${services[@]}"; do
        if docker-compose -f $DOCKER_COMPOSE_FILE ps $service | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
            return 1
        fi
    done
    
    # Test API endpoint
    print_status "Testing API endpoint..."
    if curl -f -s http://localhost:2025/api/health > /dev/null; then
        print_success "API endpoint is responding"
    else
        print_error "API endpoint is not responding"
        return 1
    fi
    
    # Test frontend
    print_status "Testing frontend..."
    if curl -f -s http://localhost:2025/health > /dev/null; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding"
        return 1
    fi
    
    print_success "Deployment verification completed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    echo ""
    print_status "Service URLs:"
    echo "  Frontend: http://$SERVER_IP:2025"
    echo "  API: http://$SERVER_IP:2025/api"
    echo "  Health Check: http://$SERVER_IP:2025/health"
    echo ""
    print_status "Database Information:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    print_status "Logs can be viewed with:"
    echo "  docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service_name]"
}

# Main deployment function
main() {
    echo "============================================================================="
    echo "NXZEN EMPLOYEE MANAGEMENT SYSTEM - EXTERNAL DATABASE DEPLOYMENT"
    echo "============================================================================="
    echo "Server: $SERVER_IP"
    echo "Application: $APP_NAME"
    echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    echo "============================================================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Check database connection
    check_database
    
    # Check database tables
    check_database_tables
    
    # Create backup
    create_backup
    
    # Stop existing services
    stop_services
    
    # Clean up old images
    cleanup_images
    
    # Deploy services
    deploy_services
    
    # Verify deployment
    if verify_deployment; then
        print_success "Deployment completed successfully!"
        echo ""
        show_status
        echo ""
        print_success "Your NXZEN Employee Management System is now live!"
        print_status "Access your application at: http://$SERVER_IP:2025"
    else
        print_error "Deployment verification failed"
        print_status "Checking logs for troubleshooting..."
        docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=100
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "backup")
        create_backup
        ;;
    "stop")
        stop_services
        ;;
    "start")
        deploy_services
        ;;
    "restart")
        stop_services
        deploy_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f "${2:-}"
        ;;
    "cleanup")
        cleanup_images
        ;;
    "check-db")
        check_database
        check_database_tables
        ;;
    *)
        main
        ;;
esac
