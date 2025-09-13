# 🧪 Postman Testing Guide for Onboard Application

## 📋 **Prerequisites**

1. **Start the Backend Server:**

   ```bash
   cd backend
   npm install
   npm start
   ```

   Server should run on `http://localhost:5001`

2. **Database Setup:**
   - Ensure PostgreSQL is running
   - Database should be configured with sample data

## 🚀 **Quick Start Testing**

### **Step 1: Import Collections & Environment**

1. **Import Collections:**

   - Import `Onboard_API_Postman_Collection.json` (Comprehensive)
   - Import `Onboard_API_Simple.json` (Quick tests)

2. **Import Environment:**
   - Import `Postman_Environment.json`
   - Select "Onboard Test Environment" in Postman

### **Step 2: Test Authentication Flow**

#### **2.1 Health Check**

- **Request:** `GET /api/health`
- **Expected:** `200 OK` with `{"status": "OK", "message": "Server is running"}`

#### **2.2 HR Login**

- **Request:** `POST /api/auth/login`
- **Body:**
  ```json
  {
    "email": "hr@nxzen.com",
    "password": "hr123"
  }
  ```
- **Expected:** `200 OK` with JWT token
- **Action:** Copy the `token` from response and set it in environment variable `auth_token`

#### **2.3 Employee Login**

- **Request:** `POST /api/auth/login`
- **Body:**
  ```json
  {
    "email": "stalin.j@nxzen.com",
    "password": "password123"
  }
  ```
- **Expected:** `200 OK` with JWT token

#### **2.4 Get Current User**

- **Request:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer {{auth_token}}`
- **Expected:** `200 OK` with user details

## 🔍 **Comprehensive Testing Scenarios**

### **Scenario 1: HR Dashboard Testing**

1. **Get All Employees**

   - **Request:** `GET /api/hr/employees`
   - **Headers:** `Authorization: Bearer {{auth_token}}`
   - **Expected:** List of all employees

2. **Get Master Data**

   - **Request:** `GET /api/hr/master`
   - **Expected:** Master data including departments, designations, etc.

3. **Get Employee Forms**

   - **Request:** `GET /api/hr/employee-forms`
   - **Expected:** All employee onboarding forms

4. **Get Document Collection**
   - **Request:** `GET /api/hr/document-collection`
   - **Expected:** Document requirements and status

### **Scenario 2: Employee Onboarding Testing**

1. **Get Onboarding Status**

   - **Request:** `GET /api/employee/onboarding-status`
   - **Expected:** Current onboarding status

2. **Get Onboarding Form**

   - **Request:** `GET /api/employee/onboarding-form`
   - **Expected:** Form data if exists

3. **Submit Onboarding Form**
   - **Request:** `POST /api/employee/onboarding-form`
   - **Body:**
     ```json
     {
       "type": "Full-Time",
       "formData": {
         "name": "Test Employee",
         "email": "test@nxzen.com",
         "phone": "1234567890",
         "department": "Engineering",
         "designation": "Software Engineer",
         "doj": "2025-01-15"
       },
       "files": []
     }
     ```

### **Scenario 3: Attendance Management Testing**

1. **Get My Attendance**

   - **Request:** `GET /api/attendance/my-attendance`
   - **Query Params:** `start_date=2025-01-01&end_date=2025-01-31`

2. **Mark Attendance**

   - **Request:** `POST /api/attendance/mark`
   - **Body:**
     ```json
     {
       "date": "2025-01-15",
       "status": "present",
       "checkintime": "09:00",
       "checkouttime": "18:00",
       "notes": "Full day work",
       "hours": 8
     }
     ```

3. **Get Attendance Settings**

   - **Request:** `GET /api/attendance/settings`

4. **Get Attendance Stats (HR)**
   - **Request:** `GET /api/attendance/stats?month=1&year=2025`

### **Scenario 4: Leave Management Testing**

1. **Get Leave Types**

   - **Request:** `GET /api/leave/types`

2. **Get Pending Leave Requests (HR)**

   - **Request:** `GET /api/leave/hr/pending`

3. **Approve Leave Request**
   - **Request:** `PUT /api/leave/hr/1/approve`
   - **Body:**
     ```json
     {
       "notes": "Approved by HR"
     }
     ```

### **Scenario 5: Expense Management Testing**

1. **Get Expense Categories**

   - **Request:** `GET /api/expenses/categories`

2. **Submit Expense Request**

   - **Request:** `POST /api/expenses/submit`
   - **Body:** (form-data)
     - `expenseCategory`: "Travel"
     - `expenseType`: "Taxi"
     - `amount`: "500"
     - `currency`: "INR"
     - `description`: "Test expense"
     - `expenseDate`: "2025-01-15"
     - `taxIncluded`: "false"

3. **Get Pending Expense Requests (HR)**
   - **Request:** `GET /api/expenses/hr/pending`

### **Scenario 6: Manager Dashboard Testing**

1. **Get Manager Dashboard**

   - **Request:** `GET /api/manager/dashboard`

2. **Get My Team**

   - **Request:** `GET /api/attendance/my-team`

3. **Get Team Attendance**
   - **Request:** `GET /api/attendance/team-attendance?start_date=2025-01-01&end_date=2025-01-31`

## 🧪 **Automated Test Scripts**

### **Pre-request Scripts (for automatic token handling):**

```javascript
// Auto-login script for HR
if (!pm.environment.get("auth_token")) {
  pm.sendRequest(
    {
      url: pm.environment.get("base_url") + "/api/auth/login",
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
      body: {
        mode: "raw",
        raw: JSON.stringify({
          email: pm.environment.get("hr_email"),
          password: pm.environment.get("hr_password"),
        }),
      },
    },
    function (err, response) {
      if (response.json().token) {
        pm.environment.set("auth_token", response.json().token);
      }
    }
  );
}
```

### **Test Scripts (for response validation):**

```javascript
// Basic response validation
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("message");
});

// Authentication test
pm.test("Token is present", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("token");
  pm.environment.set("auth_token", jsonData.token);
});
```

## 🔧 **Troubleshooting Common Issues**

### **1. Authentication Errors (401)**

- Check if token is properly set in environment
- Verify login credentials
- Ensure token hasn't expired

### **2. Database Connection Errors (500)**

- Verify PostgreSQL is running
- Check database configuration in `config.env`
- Ensure database tables are created

### **3. CORS Errors**

- Server is configured to allow all origins
- Check if server is running on correct port (5001)

### **4. Missing Data Errors**

- Run database setup scripts
- Check if sample data is inserted
- Verify user accounts exist

## 📊 **Expected Test Results**

### **Successful Test Indicators:**

- ✅ All authentication requests return 200
- ✅ JWT tokens are properly generated and used
- ✅ Role-based access control works correctly
- ✅ CRUD operations work for all modules
- ✅ File uploads work for documents and expenses
- ✅ Date validations work correctly
- ✅ Error handling returns appropriate status codes

### **Performance Benchmarks:**

- Response time < 500ms for most requests
- File uploads complete within 5 seconds
- Database queries execute efficiently

## 🎯 **Testing Checklist**

- [ ] Server starts successfully
- [ ] Database connection established
- [ ] Health check endpoint works
- [ ] Authentication flow works for all user types
- [ ] HR endpoints return data correctly
- [ ] Employee onboarding flow works
- [ ] Attendance marking and retrieval works
- [ ] Leave management functions properly
- [ ] Expense submission and approval works
- [ ] Manager dashboard shows team data
- [ ] Document upload and retrieval works
- [ ] Error handling works as expected
- [ ] Role-based permissions enforced

## 🚀 **Next Steps After Testing**

1. **Performance Testing:** Use Postman's Collection Runner for load testing
2. **Integration Testing:** Test complete user workflows
3. **Security Testing:** Verify authentication and authorization
4. **API Documentation:** Generate documentation from Postman collections
5. **Monitoring:** Set up API monitoring and alerting

---

**Happy Testing! 🎉**

For any issues or questions, check the server logs and database status.
