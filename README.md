# ONDOARD - Employee Onboarding + Attendance Application

A comprehensive full-stack application for managing employee onboarding and attendance tracking with HR management capabilities.

## 🚀 Features

### Authentication & User Management
- **Dual Login System**: HR and Employee portals
- **JWT Authentication**: Secure token-based authentication
- **Password Management**: Temporary password generation and forced reset for new employees
- **Role-based Access Control**: HR and Employee permissions

### HR Management
- **Employee Onboarding**: Add new employees with automatic email notifications
- **Form Management**: View, edit, and approve employee onboarding forms
- **Employee Master Table**: Centralized employee database
- **Approval Workflow**: Approve/reject onboarding applications

### Employee Portal
- **Onboarding Forms**: Dynamic forms based on employment type (Intern/Contract/Full-Time)
- **Status Tracking**: Real-time onboarding status updates
- **File Uploads**: Optional document attachments
- **Form Locking**: Prevents editing after submission

### Attendance System
- **Daily Attendance**: Mark Present/Work From Home/Leave
- **Calendar View**: Visual attendance calendar with color coding
- **Time Tracking**: Clock in/out functionality for present employees
- **Leave Management**: Submit and track leave requests

### HR Dashboard
- **Attendance Overview**: View all employees' attendance
- **Statistics**: Pie charts showing attendance percentages
- **Filtering**: Filter by month, day, or specific employee
- **Drill-down**: Detailed employee attendance history

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **Nodemailer** for email integration
- **bcrypt** for password hashing
- **Express Validator** for input validation

### Frontend
- **React.js** with functional components and hooks
- **TailwindCSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **date-fns** for date manipulation
- **Recharts** for data visualization

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ONDOARD
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install-all
```

### 3. Database Setup
1. Create a PostgreSQL database named `onboard`
2. Update database credentials in `backend/config.env`:
```env
DB_HOST=localhost
DB_PORT=5434
DB_NAME=onboard
DB_USER=postgres
DB_PASSWORD=postgres
```

### 4. Email Configuration
Update email settings in `backend/config.env`:
```env
EMAIL_USER=alphanxzen@gmail.com
EMAIL_PASS=rewn cxqu eiuz fgmd
```

### 5. Environment Variables
Ensure your `backend/config.env` file contains:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5434
DB_NAME=onboard
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Email Configuration
EMAIL_USER=alphanxzen@gmail.com
EMAIL_PASS=rewn cxqu eiuz fgmd

# Server Configuration
PORT=5000
NODE_ENV=development
```

## 🚀 Running the Application

### Development Mode (Both Frontend & Backend)
```bash
npm run dev
```

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm run client
```

### Production Build
```bash
npm run build
npm start
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔐 Default Credentials

### HR Login
- **Email**: hr@nxzen.com
- **Password**: hr123

### Employee Login
- Employees receive temporary passwords via email when added by HR
- First login requires password reset

## 📊 Database Schema

### Tables
1. **users** - User authentication and roles
2. **employee_forms** - Onboarding form submissions
3. **employee_master** - Approved employee records
4. **attendance** - Daily attendance records
5. **leave_requests** - Employee leave applications

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### HR Management
- `POST /api/hr/employees` - Add new employee
- `GET /api/hr/employees` - Get all employees
- `PUT /api/hr/employees/:id/approve` - Approve/reject employee
- `GET /api/hr/master` - Get employee master table

### Employee Portal
- `GET /api/employee/onboarding-status` - Get onboarding status
- `POST /api/employee/onboarding-form` - Submit onboarding form
- `GET /api/employee/is-onboarded` - Check if onboarded

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/calendar` - Get calendar data
- `GET /api/attendance/stats` - Get attendance statistics

## 📧 Email Integration

The application automatically sends emails for:
- **Employee Onboarding**: Welcome email with login credentials
- **Password Reset**: Password reset links
- **Notifications**: Status updates and approvals

## 🎨 UI Components

### Core Components
- **Login/PasswordReset**: Authentication forms
- **HRDashboard**: HR management interface
- **EmployeeDashboard**: Employee onboarding portal
- **AttendancePortal**: Attendance management
- **AttendanceCalendar**: Visual calendar component

### Reusable Components
- **ProtectedRoute**: Authentication guard
- **AddEmployeeModal**: Employee creation form
- **EmployeeList**: Employee management table
- **AttendanceStats**: Statistics visualization

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt encryption
- **Input Validation**: Express validator middleware
- **CORS Protection**: Cross-origin request handling
- **Rate Limiting**: API request throttling
- **Helmet**: Security headers

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and deploy to your server
3. Configure PostgreSQL connection
4. Set up email SMTP credentials

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy the `build` folder to your web server
3. Configure API endpoint URLs for production

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection**: Verify PostgreSQL is running and credentials are correct
2. **Email Sending**: Check Gmail app password and SMTP settings
3. **Port Conflicts**: Ensure ports 3000 and 5000 are available
4. **CORS Issues**: Verify frontend URL in backend CORS configuration

### Logs
- Backend logs are displayed in the console
- Check browser console for frontend errors
- Database connection status is logged on startup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Open an issue on GitHub

---

**Note**: This is a development application. For production use, ensure proper security measures, environment variable management, and database backup strategies are implemented.
