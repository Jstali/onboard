import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaCalendarAlt,
  FaSignOutAlt,
  FaClipboardList,
  FaCalendarCheck,
  FaUserEdit,
  FaCog,
  FaReceipt,
  FaChartBar,
  FaFileAlt,
  FaChevronDown,
  FaChevronRight,
  FaUser,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import AddEmployeeModal from "./AddEmployeeModal";
import AttendanceStats from "./AttendanceStats";
import EmployeeMaster from "./EmployeeMaster";
import HRLeaveApproval from "./HRLeaveApproval";
import OnboardedEmployees from "./OnboardedEmployees";
import EmployeeFormManagement from "./EmployeeFormManagement";
import HRAttendanceDetails from "./HRAttendanceDetails";
import EmployeeCRUD from "./EmployeeCRUD";
import HRConfig from "./HRConfig";
import HRExpenseManagement from "./HRExpenseManagement";
import HRExpenseAnalytics from "./HRExpenseAnalytics";
import HRDocumentCollection from "./HRDocumentCollection";
import HRPayoutManagement from "./HRPayoutManagement";
import HRPNCMonitoring from "./HRPNCMonitoring";

const HRDashboardSidebar = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("employees");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [masterEmployees, setMasterEmployees] = useState([]);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    employee: true,
    management: true,
    analytics: false,
  });

  // Debug logging
  console.log("🔍 HRDashboardSidebar mounted - Active tab:", activeTab);

  useEffect(() => {
    console.log("🔍 HRDashboardSidebar useEffect triggered");
    try {
      fetchMasterEmployees();
    } catch (error) {
      console.error("❌ Error in HRDashboardSidebar useEffect:", error);
      setError("Failed to initialize dashboard");
    }
  }, []);

  const fetchMasterEmployees = async () => {
    try {
      console.log("🔍 Fetching master employees...");
      const response = await axios.get("http://localhost:5001/api/hr/master");
      console.log("✅ Master employees fetched:", response.data);
      console.log(
        "📊 Number of employees:",
        response.data.employees?.length || 0
      );
      setMasterEmployees(response.data.employees || []);
      setError("");
    } catch (error) {
      console.error("❌ Error fetching master employees:", error);
      setError("Failed to fetch employees");
      toast.error("Failed to fetch employees");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Organized tabs into logical groups for sidebar
  const sidebarSections = [
    {
      id: "employee",
      title: "Employee Management",
      icon: FaUsers,
      tabs: [
        { id: "employees", label: "Employees", icon: FaUsers },
        { id: "forms", label: "Employee Forms", icon: FaClipboardList },
        {
          id: "document-collection",
          label: "Document Collection",
          icon: FaFileAlt,
        },
        { id: "onboarded", label: "Onboarded Employees", icon: FaUsers },
      ],
    },
    {
      id: "management",
      title: "HR Operations",
      icon: FaUserEdit,
      tabs: [
        { id: "master", label: "Employee Master", icon: FaUsers },
        { id: "attendance", label: "Attendance", icon: FaCalendarAlt },
        { id: "leave", label: "Leave Management", icon: FaCalendarCheck },
        { id: "expenses", label: "Expense Management", icon: FaReceipt },
      ],
    },
    {
      id: "analytics",
      title: "Analytics & Reports",
      icon: FaChartBar,
      tabs: [
        { id: "stats", label: "Attendance Statistics", icon: FaChartBar },
        {
          id: "expense-analytics",
          label: "Expense Analytics",
          icon: FaChartBar,
        },
        {
          id: "pnc-monitoring",
          label: "P&C Monthly Monitoring",
          icon: FaChartBar,
        },
        { id: "payout", label: "Payout Management", icon: FaReceipt },
        { id: "config", label: "HR Config", icon: FaCog },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-green-600">nxzen</h1>
          <p className="text-sm text-gray-600">HR Dashboard</p>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <div key={section.id} className="mb-4">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <SectionIcon className="mr-3 text-gray-500" />
                    {section.title}
                  </div>
                  {isExpanded ? (
                    <FaChevronDown className="text-gray-400" />
                  ) : (
                    <FaChevronRight className="text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-6 mt-2 space-y-1">
                    {section.tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeTab === tab.id
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="mr-3 text-gray-500" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                HR Employee Onboarding & Attendance Management
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <FaUser className="mr-2" />
                Profile
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Error Boundary */}
          <div className="mb-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === "employees" && (
            <EmployeeCRUD
              employees={masterEmployees}
              onRefresh={fetchMasterEmployees}
              onAddEmployee={() => setShowAddEmployee(true)}
            />
          )}
          {activeTab === "forms" && (
            <EmployeeFormManagement onRefresh={fetchMasterEmployees} />
          )}
          {activeTab === "document-collection" && (
            <HRDocumentCollection onRefresh={fetchMasterEmployees} />
          )}
          {activeTab === "onboarded" && (
            <OnboardedEmployees onRefresh={fetchMasterEmployees} />
          )}
          {activeTab === "master" && (
            <EmployeeMaster
              employees={masterEmployees}
              onRefresh={fetchMasterEmployees}
            />
          )}
          {activeTab === "attendance" && <HRAttendanceDetails />}
          {activeTab === "leave" && <HRLeaveApproval />}
          {activeTab === "expenses" && <HRExpenseManagement />}
          {activeTab === "stats" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Attendance Statistics
              </h2>
              <AttendanceStats />
            </div>
          )}
          {activeTab === "expense-analytics" && <HRExpenseAnalytics />}
          {activeTab === "pnc-monitoring" && <HRPNCMonitoring />}
          {activeTab === "payout" && <HRPayoutManagement />}
          {activeTab === "config" && <HRConfig />}
        </main>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => {
            setShowAddEmployee(false);
            fetchMasterEmployees();
            toast.success("Employee added successfully!");
          }}
        />
      )}
    </div>
  );
};

export default HRDashboardSidebar;
