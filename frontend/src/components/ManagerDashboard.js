import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  FaCalendarCheck,
  FaSignOutAlt,
  FaUsers,
  FaUserEdit,
  FaReceipt,
} from "react-icons/fa";

const ManagerDashboard = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Manager Dashboard
              </h1>
              <span className="ml-4 text-sm text-gray-500">
                Welcome, {user?.first_name} {user?.last_name}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <FaUserEdit className="mr-2" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/manager/leave-requests"
            className="bg-blue-600 text-white p-6 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            <div className="flex items-center">
              <FaCalendarCheck className="text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-semibold">Leave Requests</h3>
                <p className="text-blue-100">
                  Review and approve leave requests
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/manager/expense-requests"
            className="bg-orange-600 text-white p-6 rounded-lg shadow-lg hover:bg-orange-700 transition-colors"
          >
            <div className="flex items-center">
              <FaReceipt className="text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-semibold">Expense Requests</h3>
                <p className="text-orange-100">
                  Review and approve expense claims
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-green-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <FaUsers className="text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-semibold">Team Management</h3>
                <p className="text-green-100">Manage your team members</p>
              </div>
            </div>
          </div>

          <Link
            to="/profile"
            className="bg-purple-600 text-white p-6 rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
          >
            <div className="flex items-center">
              <FaUserEdit className="text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-semibold">Profile Settings</h3>
                <p className="text-purple-100">Manage your account settings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Dashboard Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dashboard Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                Leave Management
              </h3>
              <p className="text-blue-600">
                As a manager, you can review and approve leave requests from
                your team members. Click on "Leave Requests" above to get
                started.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-orange-800 mb-2">
                Expense Management
              </h3>
              <p className="text-orange-600">
                Review and approve expense claims from your team members. Ensure
                all expenses are legitimate and within company policy.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                Team Overview
              </h3>
              <p className="text-green-600">
                Monitor your team's attendance, leave patterns, and overall
                performance to ensure smooth operations.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
