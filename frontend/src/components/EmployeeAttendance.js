import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaTable,
  FaCheck,
  FaHome,
  FaTimes,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [view, setView] = useState("weekly"); // weekly, calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});

  // Get week start (Monday) and end (Sunday)
  const getWeekDates = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
  };

  // Get month start and end
  const getMonthDates = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  };

  // Fetch attendance data
  const fetchAttendance = async (startDate, endDate) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, skipping attendance fetch");
        toast.error("Please login to view attendance");
        setLoading(false);
        return;
      }

      // Validate date parameters
      if (!startDate || !endDate) {
        console.error("Missing date parameters");
        toast.error("Invalid date range provided");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/attendance/my-attendance?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setAttendance(data.attendance || []);

          // Show friendly message if no records found
          if (data.attendance && data.attendance.length === 0) {
            toast.info("No attendance records found for the selected period");
          }
        } else {
          console.error("Response is not JSON:", contentType);
          toast.error("Invalid response format from server");
          setAttendance([]);
        }
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || "Invalid request parameters";
        toast.error(message);
        setAttendance([]);
      } else if (response.status === 401) {
        console.log("Unauthorized - user needs to login");
        // Clear invalid token
        localStorage.removeItem("token");
        toast.error("Please login again to continue");
        setAttendance([]);
      } else if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || "No attendance records found";
        toast.info(message);
        setAttendance([]);
      } else if (response.status === 500) {
        console.error("Server error fetching attendance:", response.status);
        toast.error("Failed to fetch attendance. Please try again.");
        setAttendance([]);
      } else {
        console.error("Failed to fetch attendance:", response.status);
        toast.error("Failed to fetch attendance. Please try again.");
        setAttendance([]);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance. Please try again.");
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance settings
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, skipping settings fetch");
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/attendance/settings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setSettings(data.settings);
        } else {
          console.error("Response is not JSON:", contentType);
        }
      } else if (response.status === 401) {
        console.log("Unauthorized - user needs to login");
        // Clear invalid token
        localStorage.removeItem("token");
      } else {
        console.error("Failed to fetch settings:", response.status);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  // Mark attendance for a single day
  const markAttendance = async (
    date,
    status,
    checkInTime = null,
    checkOutTime = null,
    notes = ""
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/api/attendance/mark",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date,
            status,
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            notes,
          }),
        }
      );

      if (response.ok) {
        toast.success("Attendance marked successfully");
        // Refresh attendance data
        const { start, end } =
          view === "weekly"
            ? getWeekDates(new Date())
            : getMonthDates(currentMonth);
        fetchAttendance(
          start.toISOString().split("T")[0],
          end.toISOString().split("T")[0]
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to mark attendance");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };

  // Get attendance status for a specific date
  const getAttendanceForDate = (date) => {
    // Format the input date as YYYY-MM-DD without timezone issues
    const inputDate = new Date(date);
    const inputYear = inputDate.getFullYear();
    const inputMonth = String(inputDate.getMonth() + 1).padStart(2, "0");
    const inputDay = String(inputDate.getDate()).padStart(2, "0");
    const formattedInputDate = `${inputYear}-${inputMonth}-${inputDay}`;

    return (
      attendance.find((a) => {
        // Format the attendance date as YYYY-MM-DD for comparison
        const attendanceDate = new Date(a.date);
        const attendanceYear = attendanceDate.getFullYear();
        const attendanceMonth = String(attendanceDate.getMonth() + 1).padStart(
          2,
          "0"
        );
        const attendanceDay = String(attendanceDate.getDate()).padStart(2, "0");
        const formattedAttendanceDate = `${attendanceYear}-${attendanceMonth}-${attendanceDay}`;
        return formattedAttendanceDate === formattedInputDate;
      }) || null
    );
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case "present":
        return {
          icon: <FaCheck className="text-green-600" />,
          color: "bg-green-100 text-green-800",
        };
      case "wfh":
        return {
          icon: <FaHome className="text-blue-600" />,
          color: "bg-blue-100 text-blue-800",
        };
      case "leave":
        return {
          icon: <FaTimes className="text-red-600" />,
          color: "bg-red-100 text-red-800",
        };
      case "absent":
        return {
          icon: <FaTimes className="text-gray-600" />,
          color: "bg-gray-100 text-gray-800",
        };
      case "half_day":
        return {
          icon: <FaClock className="text-orange-600" />,
          color: "bg-orange-100 text-orange-800",
        };
      default:
        return { icon: null, color: "bg-gray-100 text-gray-800" };
    }
  };

  // Generate week days - Always current week
  const generateWeekDays = () => {
    const { start } = getWeekDates(new Date());
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }

    return days;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const { start, end } = getMonthDates(currentMonth);
    const days = [];

    // Add days from previous month to fill first week
    const firstDay = start.getDay();
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(start.getDate() - i - 1);
      days.push({ date, isCurrentMonth: false });
    }

    // Add current month days
    for (let i = 0; i < end.getDate(); i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add days from next month to fill last week
    const lastDay = end.getDay();
    for (let i = 1; i <= 6 - lastDay; i++) {
      const date = new Date(end);
      date.setDate(end.getDate() + i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  // Navigation functions - Only for calendar view (managers can navigate months)
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  // Initialize component
  useEffect(() => {
    if (user && user.id) {
      fetchSettings();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.id) {
      if (view === "weekly") {
        // Always use current week (today's week)
        const today = new Date();
        const { start, end } = getWeekDates(today);
        fetchAttendance(
          start.toISOString().split("T")[0],
          end.toISOString().split("T")[0]
        );
      } else if (view === "calendar") {
        const { start, end } = getMonthDates(currentMonth);
        fetchAttendance(
          start.toISOString().split("T")[0],
          end.toISOString().split("T")[0]
        );
      }
    }
  }, [user, view, currentMonth]);

  // Show loading or authentication message
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Attendance</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setView("weekly")}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              view === "weekly"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <FaTable />
            <span>Weekly View</span>
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              view === "calendar"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <FaCalendarAlt />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      {/* Weekly View */}
      {view === "weekly" && (
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Current Week Header */}
          <div className="flex justify-center items-center p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              Current Week:{" "}
              {getWeekDates(new Date()).start.toLocaleDateString()} -{" "}
              {getWeekDates(new Date()).end.toLocaleDateString()}
            </h3>
          </div>

          {/* Weekly Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generateWeekDays().map((date, index) => {
                  const attendanceRecord = getAttendanceForDate(
                    date.toISOString().split("T")[0]
                  );
                  const isToday =
                    date.toDateString() === new Date().toDateString();
                  const isPast = date < new Date().setHours(0, 0, 0, 0);

                  return (
                    <tr key={index} className={isToday ? "bg-blue-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendanceRecord ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getStatusDisplay(attendanceRecord.status).color
                            }`}
                          >
                            {attendanceRecord.status.charAt(0).toUpperCase() +
                              attendanceRecord.status.slice(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendanceRecord?.check_in_time || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendanceRecord?.check_out_time || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <select
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                            value={attendanceRecord?.status || ""}
                            onChange={(e) => {
                              if (e.target.value) {
                                // Format date as YYYY-MM-DD without timezone issues
                                const year = date.getFullYear();
                                const month = String(
                                  date.getMonth() + 1
                                ).padStart(2, "0");
                                const day = String(date.getDate()).padStart(
                                  2,
                                  "0"
                                );
                                const formattedDate = `${year}-${month}-${day}`;
                                markAttendance(formattedDate, e.target.value);
                              }
                            }}
                            disabled={false}
                          >
                            <option value="">Select Status</option>
                            <option value="present">Present</option>
                            <option value="wfh">WFH</option>
                            <option value="leave">Leave</option>
                            <option value="absent">Absent</option>
                            <option value="half_day">Half Day</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Attendance Summary */}
          <div className="p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {loading
                ? "Loading..."
                : `${
                    attendance.filter((a) => {
                      const attendanceDate = new Date(a.date);
                      const weekStart = getWeekDates(new Date()).start;
                      const weekEnd = getWeekDates(new Date()).end;
                      return (
                        attendanceDate >= weekStart && attendanceDate <= weekEnd
                      );
                    }).length
                  } days marked this week`}
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Month Navigation */}
          <div className="flex justify-between items-center p-4 border-b">
            <button
              onClick={goToPreviousMonth}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Previous Month
            </button>
            <h3 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={goToNextMonth}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Next Month
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {generateCalendarDays().map(({ date, isCurrentMonth }, index) => {
                // Format date as YYYY-MM-DD without timezone issues
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const formattedDate = `${year}-${month}-${day}`;
                const attendanceRecord = getAttendanceForDate(formattedDate);
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isPast = date < new Date().setHours(0, 0, 0, 0);

                return (
                  <div
                    key={index}
                    className={`p-2 min-h-[80px] border border-gray-200 ${
                      !isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
                    } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {date.getDate()}
                    </div>
                    {isCurrentMonth && (
                      <div className="space-y-1">
                        {attendanceRecord ? (
                          <div
                            className={`text-xs px-1 py-0.5 rounded ${
                              getStatusDisplay(attendanceRecord.status).color
                            }`}
                          >
                            {attendanceRecord.status.charAt(0).toUpperCase() +
                              attendanceRecord.status.slice(1)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">
                            No attendance
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {
                attendance.filter((a) => {
                  const attendanceDate = new Date(a.date);
                  const monthStart = getMonthDates(currentMonth).start;
                  const monthEnd = getMonthDates(currentMonth).end;
                  return (
                    attendanceDate >= monthStart &&
                    attendanceDate <= monthEnd &&
                    a.status === "present"
                  );
                }).length
              }
            </div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {
                attendance.filter((a) => {
                  const attendanceDate = new Date(a.date);
                  const monthStart = getMonthDates(currentMonth).start;
                  const monthEnd = getMonthDates(currentMonth).end;
                  return (
                    attendanceDate >= monthStart &&
                    attendanceDate <= monthEnd &&
                    a.status === "wfh"
                  );
                }).length
              }
            </div>
            <div className="text-sm text-gray-600">WFH</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {
                attendance.filter((a) => {
                  const attendanceDate = new Date(a.date);
                  const monthStart = getMonthDates(currentMonth).start;
                  const monthEnd = getMonthDates(currentMonth).end;
                  return (
                    attendanceDate >= monthStart &&
                    attendanceDate <= monthEnd &&
                    a.status === "leave"
                  );
                }).length
              }
            </div>
            <div className="text-sm text-gray-600">Leave</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {
                attendance.filter((a) => {
                  const attendanceDate = new Date(a.date);
                  const monthStart = getMonthDates(currentMonth).start;
                  const monthEnd = getMonthDates(currentMonth).end;
                  return (
                    attendanceDate >= monthStart &&
                    attendanceDate <= monthEnd &&
                    a.status === "absent"
                  );
                }).length
              }
            </div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {
                attendance.filter((a) => {
                  const attendanceDate = new Date(a.date);
                  const monthStart = getMonthDates(currentMonth).start;
                  const monthEnd = getMonthDates(currentMonth).end;
                  return (
                    attendanceDate >= monthStart &&
                    attendanceDate <= monthEnd &&
                    a.status === "half_day"
                  );
                }).length
              }
            </div>
            <div className="text-sm text-gray-600">Half Day</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
