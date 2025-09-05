import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  FaSignOutAlt,
  FaUserEdit,
  FaCalendarAlt,
  FaCheckCircle,
  FaCalendarPlus,
  FaFileAlt,
  FaReceipt,
  FaHistory,
} from "react-icons/fa";
import axios from "axios";
import OnboardingForm from "./OnboardingForm";
import OnboardingStatus from "./OnboardingStatus";
import DocumentStatus from "./DocumentStatus";
import EmployeeExpenseRequest from "./EmployeeExpenseRequest";
import EmployeeExpenseHistory from "./EmployeeExpenseHistory";
import { Link } from "react-router-dom";

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    checkOnboardingStatus();
    checkIfOnboarded();
    if (user) {
      fetchEmployeeData();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get("/employee/onboarding-status");
      setOnboardingStatus(response.data);
    } catch (error) {
      console.error("Failed to get onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfOnboarded = async () => {
    try {
      const response = await axios.get("/employee/is-onboarded");
      setIsOnboarded(response.data.isOnboarded);
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get("/employee/onboarding-form");
      setEmployeeData(response.data.form);
    } catch (error) {
      if (error.response?.status === 404) {
        // Employee hasn't submitted onboarding form yet - this is expected
        console.log(
          "No onboarding form found - employee needs to complete onboarding"
        );
        setEmployeeData(null);
      } else {
        console.error("Failed to fetch employee data:", error);
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <div className="flex items-center space-x-3 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105">
                <img
                  src={require("../assets/nxzen.png")}
                  alt="nxzen Logo"
                  className="w-10 h-10 object-contain transition-transform duration-300 hover:rotate-12"
                />
                <div className="text-black font-semibold text-lg transition-colors duration-300 hover:text-primary-600">
                  NXZEN
                </div>
              </div>
              <div className="border-l border-gray-300 h-8"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                Employee Portal
              </h1>
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
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Expenses Tab Navigation */}
        {isOnboarded && activeTab === "expenses" && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("expenses")}
                  className="whitespace-nowrap py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
                >
                  <FaReceipt className="inline mr-2" />
                  Submit Expense
                </button>
                <button
                  onClick={() => setActiveTab("expense-history")}
                  className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
                >
                  <FaHistory className="inline mr-2" />
                  Expense History
                </button>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
                >
                  ← Back to Dashboard
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Expenses Content */}
        {isOnboarded && activeTab === "expenses" && <EmployeeExpenseRequest />}
        {isOnboarded && activeTab === "expense-history" && (
          <EmployeeExpenseHistory
            onNavigateToSubmit={() => setActiveTab("expenses")}
          />
        )}

        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <>
            {/* Onboarding Form or Success Message */}
            {onboardingStatus?.hasForm ? (
              onboardingStatus.status ===
              "approved" ? null : onboardingStatus.status === "submitted" ? (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center mr-4">
                      <div className="w-4 h-4 bg-warning-600 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-warning-800">
                        Form Submitted Successfully!
                      </h3>
                      <p className="text-warning-700 mt-1">
                        Your onboarding form has been submitted and is awaiting
                        HR approval. You will be notified once it's approved.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <OnboardingForm onSuccess={checkOnboardingStatus} />
              )
            ) : (
              <OnboardingForm onSuccess={checkOnboardingStatus} />
            )}

            {/* Quick Actions - Only show when onboarding is approved */}
            {onboardingStatus?.status === "approved" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link
                  to="/employee/attendance"
                  className="bg-blue-600 text-white p-6 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-3xl mr-4" />
                    <div>
                      <h3 className="text-xl font-semibold">Book your time</h3>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/leave-request"
                  className="bg-green-600 text-white p-6 rounded-lg shadow-lg hover:bg-green-700 transition-colors"
                >
                  <div className="flex items-center">
                    <FaCalendarPlus className="text-3xl mr-4" />
                    <div>
                      <h3 className="text-xl font-semibold">Leave Request</h3>
                      <p className="text-green-100">
                        Submit leave applications
                      </p>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => setActiveTab("expenses")}
                  className="bg-orange-600 text-white p-6 rounded-lg shadow-lg hover:bg-orange-700 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <FaReceipt className="text-3xl mr-4" />
                    <div>
                      <h3 className="text-xl font-semibold">Expense Request</h3>
                      <p className="text-orange-100">Submit expense claims</p>
                    </div>
                  </div>
                </button>

                <Link
                  to="/company-policies"
                  className="bg-indigo-600 text-white p-6 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  <div className="flex items-center">
                    <FaFileAlt className="text-3xl mr-4" />
                    <div>
                      <h3 className="text-xl font-semibold">
                        Company Policies
                      </h3>
                      <p className="text-indigo-100">
                        View company guidelines and policies
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ) : onboardingStatus?.hasForm &&
              onboardingStatus?.status !== "approved" ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      Employee Features Pending Approval
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Your onboarding form is being reviewed. Once approved by
                      HR, you'll have access to attendance, leave requests, and
                      expense management features.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
