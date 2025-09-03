import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import {
  FaArrowLeft,
  FaClock,
  FaHome,
  FaBed,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";

const ManagerAttendance = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [currentDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  useEffect(() => {
    console.log("🔍 ManagerAttendance component mounted");
    console.log("🔍 Current URL:", window.location.pathname);
    console.log("🔍 User role:", user?.role);
    console.log("🔍 User:", user);
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      if (!token) {
        console.error("No token found");
        toast.error("Please login to view attendance");
        setAttendance([]);
        setLoading(false);
        return;
      }

      const response = await axios.get("/attendance/my-attendance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);

      if (error.response?.status === 401) {
        toast.error("Please login again to continue");
        // Clear invalid token
        localStorage.removeItem("token");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view attendance");
      } else if (error.response?.status === 404) {
        // This shouldn't happen now since we return empty array instead of 404
        setAttendance([]);
      } else if (error.response?.status === 500) {
        console.error(
          "Server error fetching attendance:",
          error.response?.data
        );
        toast.error("Failed to fetch attendance. Please try again.");
      } else {
        toast.error("Failed to fetch attendance. Please try again.");
      }

      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (status) => {
    setMarkingAttendance(true);
    try {
      const attendanceData = {
        date: currentDate,
        status: status,
        check_in_time: currentTime,
      };

      await axios.post("/attendance/mark", attendanceData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(`Attendance marked as ${status}`);
      fetchAttendance(); // Refresh the attendance data
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error(error.response?.data?.error || "Failed to mark attendance");
    } finally {
      setMarkingAttendance(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "text-green-600 bg-green-100";
      case "wfh":
        return "text-blue-600 bg-blue-100";
      case "leave":
        return "text-yellow-600 bg-yellow-100";
      case "absent":
        return "text-red-600 bg-red-100";
      case "half_day":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "-";
    }
  };

  const todayAttendance = attendance.find((a) => a.date === currentDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 mr-4"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              My Attendance (Manager)
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Today's Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(currentDate)}
            </p>
          </div>
        </div>

        {/* Today's Attendance Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Today's Attendance Status
          </h3>
          {todayAttendance ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Attendance Marked
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {todayAttendance.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    Time: {todayAttendance.check_in_time}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                  todayAttendance.status
                )}`}
              >
                {todayAttendance.status}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaTimesCircle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    No Attendance Marked
                  </p>
                  <p className="text-sm text-gray-600">
                    Please mark your attendance for today
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attendance Options */}
        {!todayAttendance && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Mark Your Attendance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => markAttendance("present")}
                disabled={markingAttendance}
                className="flex flex-col items-center p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200 disabled:opacity-50"
              >
                <FaCheckCircle className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium text-green-800">Present</h4>
                <p className="text-sm text-green-600">Mark as present</p>
              </button>

              <button
                onClick={() => markAttendance("wfh")}
                disabled={markingAttendance}
                className="flex flex-col items-center p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50"
              >
                <FaHome className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-blue-800">Work From Home</h4>
                <p className="text-sm text-blue-600">Mark as WFH</p>
              </button>

              <button
                onClick={() => markAttendance("half_day")}
                disabled={markingAttendance}
                className="flex flex-col items-center p-6 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors duration-200 disabled:opacity-50"
              >
                <FaClock className="w-8 h-8 text-orange-600 mb-2" />
                <h4 className="font-medium text-orange-800">Half Day</h4>
                <p className="text-sm text-orange-600">Mark as half day</p>
              </button>
            </div>
          </div>
        )}

        {/* Attendance History */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Attendance History
            </h3>
            <p className="text-sm text-gray-600">
              Your recent attendance records
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.check_in_time || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.check_out_time || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.total_hours || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerAttendance;
