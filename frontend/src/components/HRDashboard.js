import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  FaPlus,
  FaUsers,
  FaChartPie,
  FaCalendarAlt,
  FaSignOutAlt,
  FaClipboardList,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import AddEmployeeModal from "./AddEmployeeModal";
import EmployeeList from "./EmployeeList";
import AttendanceStats from "./AttendanceStats";
import EmployeeMaster from "./EmployeeMaster";
import HRLeaveManagement from "./HRLeaveManagement";
import OnboardedEmployees from "./OnboardedEmployees";
import EmployeeFormManagement from "./EmployeeFormManagement";

const HRDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("employees");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [masterEmployees, setMasterEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchMasterEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/hr/employees"
      );
      setEmployees(response.data.employees);
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/hr/master");
      setMasterEmployees(response.data.employees);
    } catch (error) {
      toast.error("Failed to fetch master employees");
    }
  };

  const handleAddEmployee = async (employeeData) => {
    try {
      await axios.post("http://localhost:5001/api/hr/employees", employeeData);
      toast.success("Employee added successfully!");
      setShowAddEmployee(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add employee");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const tabs = [
    { id: "employees", label: "Employees", icon: FaUsers },
    { id: "forms", label: "Employee Forms", icon: FaClipboardList },
    { id: "onboarded", label: "Onboarded Employees", icon: FaUsers },
    { id: "master", label: "Employee Master", icon: FaUsers },
    { id: "attendance", label: "Attendance", icon: FaCalendarAlt },
    { id: "leave", label: "Leave Management", icon: FaClipboardList },
    { id: "stats", label: "Statistics", icon: FaChartPie },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                ONDOARD HR Dashboard
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Employees Tab */}
        {activeTab === "employees" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Employee Management
              </h2>
              <button
                onClick={() => setShowAddEmployee(true)}
                className="btn-primary flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Employee
              </button>
            </div>
            <EmployeeList
              employees={employees}
              onRefresh={fetchEmployees}
              onApprove={fetchEmployees}
            />
          </div>
        )}

        {/* Employee Forms Tab */}
        {activeTab === "forms" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Employee Form Management
              </h2>
            </div>
            <EmployeeFormManagement
              onRefresh={() => {
                fetchEmployees();
                fetchMasterEmployees();
              }}
            />
          </div>
        )}

        {/* Onboarded Employees Tab */}
        {activeTab === "onboarded" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Onboarded Employees
              </h2>
            </div>
            <OnboardedEmployees
              onRefresh={() => {
                fetchEmployees();
                fetchMasterEmployees();
              }}
            />
          </div>
        )}

        {/* Master Tab */}
        {activeTab === "master" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Employee Master Table
              </h2>
            </div>
            <EmployeeMaster
              employees={masterEmployees}
              onRefresh={fetchMasterEmployees}
            />
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Attendance Overview
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Today's Attendance
                </h3>
                {/* Today's attendance component will go here */}
                <p className="text-gray-500">
                  Attendance data will be displayed here
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Activity
                </h3>
                {/* Recent activity component will go here */}
                <p className="text-gray-500">
                  Recent activity will be displayed here
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leave Management Tab */}
        {activeTab === "leave" && (
          <div>
            <HRLeaveManagement />
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Attendance Statistics
            </h2>
            <AttendanceStats />
          </div>
        )}
      </main>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSubmit={handleAddEmployee}
        />
      )}
    </div>
  );
};

export default HRDashboard;
