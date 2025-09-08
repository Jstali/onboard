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
  FaClock,
  FaCheck,
  FaTimes,
  FaHome,
} from "react-icons/fa";
import axios from "axios";
import { format } from "date-fns";
import OnboardingForm from "./OnboardingForm";
import OnboardingStatus from "./OnboardingStatus";
import DocumentStatus from "./DocumentStatus";
import EmployeeExpensePortal from "./EmployeeExpensePortal";
import { Link } from "react-router-dom";

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Weekly attendance state
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

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

  // Weekly attendance functions
  const getWeekDates = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
  };

  const generateWeekDays = () => {
    const { start } = getWeekDates(new Date());
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayOfWeek = date.getDay();
      // Skip Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push(date);
      }
    }

    return days;
  };

  const formatWeekRange = () => {
    const weekDays = generateWeekDays();
    if (weekDays.length === 0) return "";

    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];

    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
  };

  const fetchAttendance = async () => {
    if (!user) return;

    try {
      setAttendanceLoading(true);
      const { start, end } = getWeekDates(new Date());

      const response = await axios.get("/attendance/my-attendance", {
        params: {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
        },
      });

      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const getAttendanceForDate = (dateStr) => {
    return attendance.find(
      (att) => format(new Date(att.date), "yyyy-MM-dd") === dateStr
    );
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "present":
        return {
          icon: <FaCheck className="text-deep-space-black" />,
          color: "bg-lumen-green text-deep-space-black",
        };
      case "absent":
        return {
          icon: <FaTimes className="text-white" />,
          color: "bg-brand-coral text-white",
        };
      case "Work From Home":
        return {
          icon: <FaHome className="text-white" />,
          color: "bg-neon-violet text-white",
        };
      case "leave":
        return {
          icon: <FaClock className="text-white" />,
          color: "bg-neon-violet text-white",
        };
      case "Half Day":
        return {
          icon: <FaClock className="text-white" />,
          color: "bg-neon-violet text-white",
        };
      default:
        return {
          icon: null,
          color:
            "bg-iridescent-pearl text-deep-space-black border border-gray-300",
        };
    }
  };

  // Fetch attendance on component mount
  useEffect(() => {
    if (user && onboardingStatus?.status === "approved") {
      fetchAttendance();
    }
  }, [user, onboardingStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-iridescent-pearl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-lumen-green mx-auto mb-4"></div>
          <p className="text-deep-space-black/70">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iridescent-pearl">
      {/* Header */}
      <header className="bg-iridescent-pearl shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <div className="flex items-center space-x-3 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-lumen-green">
                  <span className="text-xl font-bold text-deep-space-black">
                    <img src="/favicon.png" alt="favicon" className="w-12 h-12" />
                  </span>
                </div>
                <div className="text-deep-space-black font-bold text-xl transition-colors duration-300 hover:text-lumen-green">
                  nxzen
                </div>
              </div>
              <div className="border-l border-gray-300 h-8"></div>
                <h1 className="brand-heading-md text-deep-space-black">
                  Employee Portal
                </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/profile"
                className="text-deep-space-black/70 hover:text-lumen-green font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/80 flex items-center"
              >
                <FaUserEdit className="mr-2" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-deep-space-black/70 hover:text-brand-coral font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-brand-coral/10 flex items-center"
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
        {/* Expense Portal - Full screen with tabs */}
        {isOnboarded && activeTab === "expenses" && (
          <EmployeeExpensePortal
            onBackToDashboard={() => setActiveTab("dashboard")}
          />
        )}

        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <>
            {/* Onboarding Form or Success Message */}
            {onboardingStatus?.hasForm ? (
              onboardingStatus.status === "approved" ? null : (
                <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
                  {onboardingStatus.status === "submitted" ? (
                    <div className="bg-white rounded-lg p-6 mb-8 border-l-4 border-brand-yellow">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-brand-yellow/20 rounded-xl flex items-center justify-center mr-4">
                          <div className="w-6 h-6 bg-brand-yellow rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-deep-space-black">
                            Form Submitted Successfully!
                          </h3>
                          <p className="text-deep-space-black/70 mt-1">
                            Your onboarding form has been submitted and is
                            awaiting HR approval. You will be notified once it's
                            approved.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <OnboardingForm onSuccess={checkOnboardingStatus} />
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
                <div className="animate-fade-in">
                  <OnboardingForm onSuccess={checkOnboardingStatus} />
                </div>
              </div>
            )}

            {/* Quick Actions - Only show when onboarding is approved */}
            {onboardingStatus?.status === "approved" ? (
              <>
                <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
                  <h2 className="text-2xl font-bold text-deep-space-black mb-6 text-center">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link
                      to="/employee/attendance"
                      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-deep-space-black">
                          <FaCalendarAlt className="text-2xl text-deep-space-black" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-deep-space-black">
                            Book your time
                          </h3>
                          <p className="text-sm text-deep-space-black/70">
                            Track attendance
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/leave-request"
                      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-neon-violet">
                          <FaCalendarPlus className="text-2xl text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-deep-space-black">
                            Leave Request
                          </h3>
                          <p className="text-sm text-deep-space-black/70">
                            Request time off
                          </p>
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={() => setActiveTab("expenses")}
                      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer text-left w-full"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-lumen-green">
                          <FaReceipt className="text-2xl text-deep-space-black" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-deep-space-black">
                            Expense Request
                          </h3>
                          <p className="text-sm text-deep-space-black/70">
                            Submit expenses
                          </p>
                        </div>
                      </div>
                    </button>

                    <Link
                      to="/company-policies"
                      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-deep-space-black">
                          <FaFileAlt className="text-2xl text-deep-space-black" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-deep-space-black">
                            Company Policies
                          </h3>
                          <p className="text-sm text-deep-space-black/70">
                            View policies
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Weekly Attendance Summary */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="animate-slide-in">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-deep-space-black">
                          This Week's Attendance
                        </h3>
                        <p className="text-sm text-deep-space-black/70 mt-1">
                          {formatWeekRange()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={fetchAttendance}
                          className="px-4 py-2 bg-lumen-green text-deep-space-black rounded-lg hover:bg-neon-violet transition-colors duration-200 disabled:opacity-50"
                          disabled={attendanceLoading}
                        >
                          {attendanceLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-deep-space-black"></div>
                          ) : (
                            "Refresh"
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {attendanceLoading ? (
                        <div className="flex justify-center items-center py-12 bg-white">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumen-green"></div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                          <table className="w-full bg-white">
                            <thead className="bg-white">
                              <tr>
                                <th className="text-left py-4 px-6 font-semibold text-deep-space-black bg-white">
                                  Day
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-deep-space-black bg-white">
                                  Date
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-deep-space-black bg-white">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {generateWeekDays().map((date, index) => {
                                const attendanceRecord = getAttendanceForDate(
                                  date.toISOString().split("T")[0]
                                );
                                const isToday =
                                  date.toDateString() ===
                                  new Date().toDateString();

                                return (
                                  <tr
                                    key={index}
                                    className={`hover:bg-gray-50 transition-colors duration-200 ${
                                      isToday
                                        ? "bg-lumen-green/10 border-l-4 border-lumen-green"
                                        : index % 2 === 0
                                        ? "bg-white"
                                        : "bg-gray-50"
                                    }`}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap bg-inherit">
                                      <span className="font-semibold text-deep-space-black">
                                        {date.toLocaleDateString("en-US", {
                                          weekday: "short",
                                        })}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap bg-inherit">
                                      <span className="text-deep-space-black/70">
                                        {date.toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap bg-inherit">
                                      {attendanceRecord ? (
                                        <span
                                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                            getStatusDisplay(
                                              attendanceRecord.status
                                            ).color
                                          }`}
                                        >
                                          {
                                            getStatusDisplay(
                                              attendanceRecord.status
                                            ).icon
                                          }
                                          <span className="ml-2">
                                            {attendanceRecord.status ===
                                            "Work From Home"
                                              ? "Work From Home"
                                              : attendanceRecord.status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                attendanceRecord.status.slice(
                                                  1
                                                )}
                                          </span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-iridescent-pearl text-deep-space-black border border-gray-300">
                                          No Record
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : onboardingStatus?.hasForm &&
              onboardingStatus?.status !== "approved" ? (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="bg-white rounded-lg p-6 border-l-4 border-gray-300">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-deep-space-black/10 rounded-xl flex items-center justify-center mr-4">
                      <div className="w-6 h-6 bg-deep-space-black/40 rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-deep-space-black">
                        Employee Features Pending Approval
                      </h3>
                      <p className="text-deep-space-black/70 mt-1">
                        Your onboarding form is being reviewed. Once approved by
                        HR, you'll have access to attendance, leave requests,
                        and expense management features.
                      </p>
                    </div>
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
