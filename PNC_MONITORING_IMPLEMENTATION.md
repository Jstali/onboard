# P&C Monthly Monitoring Report Implementation

## Overview

This document describes the implementation of the P&C Monthly Monitoring Report feature for the HR Dashboard. The feature provides comprehensive people analytics including headcount, demographics, tenure, and attrition metrics.

## 🚀 Features Implemented

### Backend API Endpoints

#### 1. GET /api/hr/pnc-monitoring

**Purpose**: Fetch monthly monitoring report data
**Parameters**:

- `month` (required): YYYY-MM format (e.g., "2025-01")

**Response Structure**:

```json
{
  "month": "2025-01",
  "period": {
    "startOfMonth": "2025-01-01",
    "endOfMonth": "2025-01-31",
    "lastDayOfMonth": 31
  },
  "statistics": {
    "totalHeadcount": 150,
    "totalContractors": 25,
    "totalLeavers": 5,
    "futureJoiners": 8,
    "totalVacancies": 12
  },
  "ageDistribution": {
    "averageAge": "32.5",
    "groups": [
      {
        "group": "Younger than 25",
        "count": 20,
        "percentage": "13.3"
      },
      {
        "group": "25 - 45",
        "count": 100,
        "percentage": "66.7"
      }
    ]
  },
  "tenure": {
    "averageLengthOfService": "3.2",
    "groups": [
      {
        "group": "Less than 12 months",
        "count": 45,
        "percentage": "30.0"
      },
      {
        "group": "1 - 3 Years",
        "count": 60,
        "percentage": "40.0"
      }
    ]
  },
  "gender": [
    {
      "gender": "Male",
      "count": 80,
      "percentage": "53.3"
    },
    {
      "gender": "Female",
      "count": 65,
      "percentage": "43.3"
    },
    {
      "gender": "Prefer not to say",
      "count": 5,
      "percentage": "3.3"
    }
  ],
  "disability": {
    "percentage": "2.5"
  },
  "attrition": {
    "percentage": "3.3"
  },
  "generatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### 2. POST /api/hr/pnc-monitoring/recalculate

**Purpose**: Recalculate metrics for a given month
**Body**: `{ "month": "2025-01" }`

### Database Queries

The implementation uses sophisticated SQL queries to aggregate data from multiple tables:

#### Key Tables Used:

- `employee_master`: Primary employee records
- `adp_payroll`: Demographic data (DOB, gender, disability status)
- `users`: User authentication and basic info

#### Key Metrics Calculated:

1. **Total Headcount**: Active employees as of last day of month
2. **Total Contractors**: Employees with type 'Contract'
3. **Total Leavers**: Employees marked inactive during the month
4. **Future Joiners**: Employees with DOJ after current month
5. **Age Distribution**: Grouped by age ranges using DOB
6. **Tenure Distribution**: Grouped by years of service using DOJ
7. **Gender Distribution**: From ADP payroll data
8. **Disability Percentage**: Percentage with disability_status = true
9. **Attrition Rate**: (Leavers / Start of month headcount) \* 100

### Frontend Components

#### HRPNCMonitoring.js

A comprehensive React component featuring:

- **Month Selector**: Dropdown with last 12 months
- **Statistics Cards**: Visual cards for key metrics
- **Charts & Visualizations**:
  - Bar charts for age and tenure distribution
  - Pie chart for gender distribution
  - Progress bars for individual metrics
- **Summary Table**: Tabular overview of all metrics
- **Real-time Updates**: Auto-refresh when month changes
- **Loading States**: Proper loading indicators
- **Error Handling**: Toast notifications for errors

#### Integration with HR Dashboard

- Added new tab "P&C Monthly Monitoring" to HR Dashboard navigation
- Integrated with existing authentication and routing
- Consistent styling with existing dashboard components

## 🎯 Key Features

### 1. Interactive Month Selection

- Dropdown selector for month/year
- Automatic data refresh when month changes
- Support for last 12 months

### 2. Comprehensive Metrics

- **Statistics**: Headcount, contractors, leavers, future joiners, vacancies
- **Demographics**: Age distribution with average age
- **Tenure**: Length of service with average tenure
- **Diversity**: Gender distribution and disability percentage
- **Attrition**: Monthly attrition rate calculation

### 3. Visual Analytics

- **Stat Cards**: Color-coded cards for key metrics
- **Bar Charts**: Age and tenure distribution
- **Pie Chart**: Gender distribution
- **Progress Bars**: Individual metric visualization
- **Summary Table**: Comprehensive overview

### 4. Real-time Features

- **Auto-refresh**: Data updates when month changes
- **Recalculate**: Manual refresh capability
- **Loading States**: User-friendly loading indicators
- **Error Handling**: Comprehensive error management

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Database      │
│   React App     │    │   Express API    │    │  PostgreSQL     │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │HR Dashboard │ │◄───┤ │ HR Routes    │ │◄───┤ │employee_    │ │
│ │             │ │    │ │              │ │    │ │master       │ │
│ │┌───────────┐│ │    │ │┌────────────┐│ │    │ └─────────────┘ │
│ ││P&C Monitor││ │    │ ││/pnc-       ││ │    │ ┌─────────────┐ │
│ ││Component  ││ │    │ ││monitoring  ││ │    │ │adp_payroll  │ │
│ │└───────────┘│ │    │ │└────────────┘│ │    │ └─────────────┘ │
│ └─────────────┘ │    │ └──────────────┘ │    │ ┌─────────────┐ │
└─────────────────┘    └──────────────────┘    │ │users        │ │
                                                │ └─────────────┘ │
                                                └─────────────────┘
```

## 🔧 Technical Implementation

### Backend (Node.js/Express)

- **Route**: `/api/hr/pnc-monitoring`
- **Authentication**: HR role required
- **Database**: PostgreSQL with complex aggregation queries
- **Validation**: Month format validation (YYYY-MM)
- **Error Handling**: Comprehensive error responses

### Frontend (React)

- **Framework**: React.js with hooks
- **Styling**: Tailwind CSS
- **Icons**: React Icons (Font Awesome)
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Database Schema

Leverages existing tables:

- `employee_master`: Employee records with status, type, DOJ
- `adp_payroll`: Demographic data (DOB, gender, disability)
- `users`: Basic user information

## 📊 Sample Data Structure

The API returns structured data optimized for frontend consumption:

```javascript
// Statistics
statistics: {
  totalHeadcount: 150,      // Total active employees
  totalContractors: 25,     // Contract employees
  totalLeavers: 5,          // Employees who left this month
  futureJoiners: 8,         // Employees joining after this month
  totalVacancies: 12        // Open positions (placeholder)
}

// Age Distribution
ageDistribution: {
  averageAge: "32.5",       // Average age in years
  groups: [                 // Age group breakdown
    { group: "25 - 45", count: 100, percentage: "66.7" },
    { group: "Younger than 25", count: 20, percentage: "13.3" }
  ]
}

// Tenure Distribution
tenure: {
  averageLengthOfService: "3.2",  // Average tenure in years
  groups: [                       // Tenure group breakdown
    { group: "1 - 3 Years", count: 60, percentage: "40.0" },
    { group: "Less than 12 months", count: 45, percentage: "30.0" }
  ]
}
```

## 🚀 Usage Instructions

### For HR Users:

1. Navigate to HR Dashboard
2. Click on "P&C Monthly Monitoring" tab
3. Select desired month from dropdown
4. View comprehensive metrics and charts
5. Use "Recalculate" button to refresh data

### For Developers:

1. **API Testing**: Use `GET /api/hr/pnc-monitoring?month=2025-01`
2. **Frontend Development**: Component is fully self-contained
3. **Database**: Ensure ADP payroll data is populated for demographics

## 🔍 Future Enhancements

### Potential Improvements:

1. **Export Functionality**: PDF/Excel export of reports
2. **Historical Trends**: Month-over-month comparisons
3. **Department Breakdown**: Metrics by department
4. **Recruitment Integration**: Real vacancy data
5. **Advanced Analytics**: Predictive attrition modeling
6. **Dashboard Customization**: Configurable metric cards

### Data Requirements:

- Ensure `adp_payroll` table has demographic data
- Consider adding recruitment/requisitions table
- Implement proper employee exit date tracking

## 📝 Notes

- **Vacancies**: Currently returns 0 (placeholder) - needs recruitment table
- **Demographics**: Depends on ADP payroll data population
- **Attrition**: Calculated as monthly leavers vs start-of-month headcount
- **Performance**: Queries optimized with proper indexing
- **Security**: HR role authentication required

## ✅ Implementation Status

- [x] Backend API endpoints
- [x] Database queries and aggregation
- [x] Frontend React component
- [x] HR Dashboard integration
- [x] Month selector functionality
- [x] Charts and visualizations
- [x] Error handling and loading states
- [x] Responsive design
- [x] Authentication integration

The P&C Monthly Monitoring Report is now fully implemented and ready for use!
