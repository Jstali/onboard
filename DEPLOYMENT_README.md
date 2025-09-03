# NXZEN HR Employee Onboarding & Attendance Management

## Deployment and Management Scripts

This document describes the deployment and management scripts for the ONDOARD HR system.

## 📁 Script Files

### Linux/macOS Scripts

- `deploy.sh` - Complete deployment script
- `stop.sh` - Stop all application services
- `restart.sh` - Restart the application

### Windows Scripts

- `start-application.bat` - Start the application
- `stop-application.bat` - Stop all application services
- `restart-application.bat` - Restart the application

### Database Migration

- `migrations/002_cleanup_managers.sql` - Clean up deleted manager data

## 🚀 Quick Start

### Linux/macOS

```bash
# Make scripts executable
chmod +x deploy.sh stop.sh restart.sh

# Deploy the application
./deploy.sh

# Stop the application
./stop.sh

# Restart the application
./restart.sh
```

### Windows

```batch
# Start the application
start-application.bat

# Stop the application
stop-application.bat

# Restart the application
restart-application.bat
```

## 📋 Prerequisites

### Required Software

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (v12 or higher)
- **PostgreSQL Client** (psql command-line tool)

### Database Setup

- Database name: `onboardd`
- Database user: `postgres`
- Database host: `localhost`
- Database port: `5432`

## 🔧 Configuration

### Environment Variables

The application uses the following configuration in `backend/config.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=onboardd
DB_USER=postgres
DB_PASSWORD=Stali

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Email Configuration
EMAIL_USER=alphanxzen@gmail.com
EMAIL_PASS=rewn cxqu eiuz fgmd

# Server Configuration
PORT=5001
NODE_ENV=development
```

## 🌐 Application URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **Database**: localhost:5432/onboardd

## 🔑 Default Login Credentials

| Role              | Email               | Password |
| ----------------- | ------------------- | -------- |
| **HR Admin**      | hr@nxzen.com        | test123  |
| **Test HR**       | testhr@nxzen.com    | test123  |
| **Manager**       | manager@company.com | test123  |
| **Test Employee** | test@test.com       | test123  |

## 📊 Current Database Status

### User Counts

- **Employees**: 5
- **HR**: 2
- **Managers**: 1 (dori d)

### Cleaned Up Data

The following managers were removed from the system:

- John Manager
- Rakesh Manager
- Test Manager
- Vamshi Manager
- Vinod Manager (both accounts)

## 🛠️ Management Commands

### View Logs

```bash
# View backend logs
tail -f backend.log

# View frontend logs
tail -f frontend.log

# View both logs
tail -f backend.log frontend.log
```

### Database Management

```bash
# Connect to database
psql -U postgres -h localhost -d onboardd

# Run migrations manually
psql -U postgres -h localhost -d onboardd -f migrations/002_cleanup_managers.sql
```

### Process Management

```bash
# Check running processes
ps aux | grep node

# Kill specific processes
pkill -f "node.*server.js"
pkill -f "npm start"

# Check port usage
lsof -i :5001
lsof -i :3001
```

## 🔄 Deployment Process

The `deploy.sh` script performs the following steps:

1. **Dependency Check** - Verifies Node.js, npm, and PostgreSQL
2. **Database Check** - Tests database connectivity
3. **Backend Setup** - Installs dependencies and starts server
4. **Frontend Setup** - Installs dependencies and starts server
5. **Migration Run** - Executes database migrations
6. **Service Start** - Starts both backend and frontend services
7. **Health Check** - Verifies services are running

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :5001
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check database exists
psql -U postgres -l | grep onboardd
```

#### Node Modules Missing

```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Log Analysis

```bash
# Check for errors in backend
grep -i error backend.log

# Check for errors in frontend
grep -i error frontend.log
```

## 📈 Monitoring

### Health Check Endpoints

- Backend: `http://localhost:5001/api/attendance/settings`
- Frontend: `http://localhost:3001`

### Performance Monitoring

```bash
# Monitor CPU usage
top -p $(pgrep -f "node.*server.js")

# Monitor memory usage
ps aux | grep node
```

## 🔒 Security Notes

- Change default passwords in production
- Update JWT_SECRET in production
- Configure proper CORS settings
- Use HTTPS in production
- Regular database backups

## 📞 Support

For issues or questions:

1. Check the logs for error messages
2. Verify all prerequisites are installed
3. Ensure database is running and accessible
4. Check firewall settings for port access

---

**Version**: 1.0.0  
**Last Updated**: 2025-09-03  
**Author**: System Administrator
