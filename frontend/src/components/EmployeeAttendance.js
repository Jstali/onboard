import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaTable,
  FaCheck,
  FaHome,
  FaTimes,
  FaClock,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("weekly"); // weekly, calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [projectInputs, setProjectInputs] = useState({});
  const [taskInputs, setTaskInputs] = useState({});
  const [hoursInputs, setHoursInputs] = useState({});

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
        `/api/attendance/my-attendance?start_date=${startDate}&end_date=${endDate}`,
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

          // Initialize hours state from fetched data
          const hoursState = {};
          (data.attendance || []).forEach((record) => {
            if (record.hours) {
              hoursState[record.date] = String(record.hours);
            }
          });
          setHoursInputs(hoursState);

          // Data loaded successfully - no popup needed for empty results
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
        // Don't show popup for 404 - this is normal when no records exist
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
        "/api/attendance/settings",
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
    notes = "",
    hours = null
  ) => {
    try {
      const token = localStorage.getItem("token");

      // Build request body, omitting null values
      const requestBody = {
        date,
        status,
      };

      // Only include optional fields if they have valid values
      if (checkInTime) requestBody.checkintime = checkInTime;
      if (checkOutTime) requestBody.checkouttime = checkOutTime;
      if (notes && notes.trim()) requestBody.notes = notes;
      if (hours !== null && hours !== undefined && hours !== "") {
        requestBody.hours = hours;
      }

      const response = await fetch(
        "/api/attendance/mark",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        toast.success("Attendance updated successfully");
        // Refresh attendance data to show updated status
        if (view === "weekly") {
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
          icon: <FaCheck className="text-deep-space-black" />,
          color: "bg-lumen-green text-deep-space-black rounded-full",
        };
      case "Work From Home":
        return {
          icon: <FaHome className="text-deep-space-black" />,
          color: "bg-neon-violet text-deep-space-black rounded-full",
        };
      case "leave":
        return {
          icon: <FaTimes className="text-deep-space-black" />,
          color: "bg-coral-red text-deep-space-black rounded-full",
        };
      case "absent":
        return {
          icon: <FaTimes className="text-deep-space-black" />,
          color: "bg-neon-violet text-deep-space-black rounded-full",
        };
      case "Half Day":
        return {
          icon: <FaClock className="text-deep-space-black" />,
          color: "bg-yellow text-deep-space-black rounded-full",
        };
      default:
        return {
          icon: null,
          color:
            "bg-iridescent-pearl text-deep-space-black border-2 border-deep-space-black rounded-full",
        };
    }
  };

  // Generate week days - Only Monday to Friday
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

  // Format week range showing only weekdays (Mon-Fri)
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
      <div className="min-h-screen bg-iridescent-pearl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lumen-green mx-auto mb-4"></div>
          <p className="text-deep-space-black">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iridescent-pearl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/employee/dashboard")}
                className="flex items-center px-3 py-2 text-sm font-medium text-deep-space-black bg-iridescent-pearl border border-deep-space-black/20 hover:bg-neon-violet/20 rounded-xl transition-colors duration-200"
              >
                <FaHome className="w-4 h-4 mr-2" />
                Home
              </button>
              <h2 className="text-3xl font-bold text-deep-space-black">
                My Attendance
              </h2>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setView("weekly")}
                className={`px-4 py-2 rounded-xl flex items-center space-x-2 shadow-md ${
                  view === "weekly"
                    ? "bg-lumen-green text-deep-space-black"
                    : "bg-iridescent-pearl text-deep-space-black border border-deep-space-black/20 hover:bg-neon-violet/20"
                }`}
              >
                <FaTable />
                <span>Weekly View</span>
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-4 py-2 rounded-xl flex items-center space-x-2 shadow-md ${
                  view === "calendar"
                    ? "bg-lumen-green text-deep-space-black"
                    : "bg-iridescent-pearl text-deep-space-black border border-deep-space-black/20 hover:bg-neon-violet/20"
                }`}
              >
                <FaCalendarAlt />
                <span>Calendar View</span>
              </button>
            </div>
          </div>

          {/* Weekly View */}
          {view === "weekly" && (
            <div className="bg-iridescent-pearl rounded-xl shadow-md border border-deep-space-black/10 overflow-hidden">
              {/* Current Week Header */}
              <div className="px-6 py-4 border-b border-deep-space-black/10">
                <h3 className="text-xl font-semibold text-deep-space-black text-center">
                  Current Week: {formatWeekRange()}
                </h3>
              </div>

              {/* Weekly Table */}
              <div className="p-6">
                <div className="overflow-x-auto rounded-xl border border-deep-space-black/10 shadow-md">
                  <table className="min-w-full bg-iridescent-pearl rounded-xl overflow-hidden">
                    <thead className="bg-iridescent-pearl border-b border-deep-space-black/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-deep-space-black uppercase tracking-wider bg-iridescent-pearl rounded-tl-xl">
                          Day
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-deep-space-black uppercase tracking-wider bg-iridescent-pearl">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-deep-space-black uppercase tracking-wider bg-iridescent-pearl">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-deep-space-black uppercase tracking-wider bg-iridescent-pearl">
                          Project
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-deep-space-black uppercase tracking-wider bg-iridescent-pearl">
                          Tasks
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-deep-space-black uppercase tracking-wider bg-iridescent-pearl">
                          Actions
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-deep-space-black uppercase tracking-wider bg-iridescent-pearl rounded-tr-xl">
                          Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-iridescent-pearl divide-y divide-deep-space-black/10">
                      {generateWeekDays().map((date, index) => {
                        const attendanceRecord = getAttendanceForDate(
                          date.toISOString().split("T")[0]
                        );
                        const isToday =
                          date.toDateString() === new Date().toDateString();
                        const isPast = date < new Date().setHours(0, 0, 0, 0);

                        return (
                          <tr
                            key={index}
                            className={`hover:bg-neon-violet/10 transition-colors duration-200 ${
                              isToday
                                ? "bg-lumen-green/10 border-l-4 border-lumen-green"
                                : index % 2 === 0
                                ? "bg-iridescent-pearl"
                                : "bg-iridescent-pearl-dark"
                            }`}
                          >
                            <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-deep-space-black bg-inherit">
                              {date.toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-deep-space-black bg-inherit">
                              {date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap bg-inherit">
                              {attendanceRecord ? (
                                <span
                                  className={`inline-flex px-3 py-1 text-sm font-medium ${
                                    getStatusDisplay(attendanceRecord.status)
                                      .color
                                  }`}
                                >
                                  {attendanceRecord.status === "Work From Home"
                                    ? "WFH"
                                    : attendanceRecord.status
                                        .charAt(0)
                                        .toUpperCase() +
                                      attendanceRecord.status.slice(1)}
                                </span>
                              ) : (
                                <span className="text-deep-space-black bg-iridescent-pearl border-2 border-deep-space-black rounded-full px-3 py-1 text-sm font-medium">
                                  Not marked
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap bg-inherit">
                              <input
                                type="text"
                                placeholder="Enter project name"
                                className="w-full bg-iridescent-pearl border border-deep-space-black/20 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-lumen-green focus:border-lumen-green text-deep-space-black placeholder:text-deep-space-black/50 transition-colors duration-200"
                                value={
                                  projectInputs[
                                    date.toISOString().split("T")[0]
                                  ] || ""
                                }
                                onChange={(e) => {
                                  const dateKey = date
                                    .toISOString()
                                    .split("T")[0];
                                  setProjectInputs((prev) => ({
                                    ...prev,
                                    [dateKey]: e.target.value,
                                  }));
                                }}
                              />
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap bg-inherit">
                              <input
                                type="text"
                                placeholder="Describe your tasks"
                                className="w-full bg-iridescent-pearl border border-deep-space-black/20 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-lumen-green focus:border-lumen-green text-deep-space-black placeholder:text-deep-space-black/50 transition-colors duration-200"
                                value={
                                  taskInputs[
                                    date.toISOString().split("T")[0]
                                  ] || ""
                                }
                                onChange={(e) => {
                                  const dateKey = date
                                    .toISOString()
                                    .split("T")[0];
                                  setTaskInputs((prev) => ({
                                    ...prev,
                                    [dateKey]: e.target.value,
                                  }));
                                }}
                              />
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap bg-inherit">
                              <select
                                className="w-full bg-iridescent-pearl border border-deep-space-black/20 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-lumen-green focus:border-lumen-green transition-colors duration-200 text-deep-space-black"
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

                                    // Mark attendance without automatically setting hours
                                    markAttendance(
                                      formattedDate,
                                      e.target.value,
                                      null,
                                      null,
                                      "",
                                      null // Don't set default hours
                                    );
                                  }
                                }}
                                disabled={false}
                              >
                                <option value="">Select Status</option>
                                <option value="present">Present</option>
                                <option value="Work From Home">WFH</option>
                                <option value="leave">Leave</option>
                                <option value="absent">Absent</option>
                                <option value="Half Day">Half Day</option>
                              </select>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap bg-inherit">
                              <select
                                className="w-full bg-iridescent-pearl border border-deep-space-black/20 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-lumen-green focus:border-lumen-green transition-colors duration-200 text-deep-space-black"
                                value={
                                  hoursInputs[
                                    date.toISOString().split("T")[0]
                                  ] || ""
                                }
                                onChange={(e) => {
                                  const dateKey = date
                                    .toISOString()
                                    .split("T")[0];

                                  // Update local state immediately
                                  setHoursInputs((prev) => ({
                                    ...prev,
                                    [dateKey]: e.target.value,
                                  }));

                                  if (
                                    e.target.value &&
                                    attendanceRecord?.status
                                  ) {
                                    // Only update hours if a status is already set
                                    const status = attendanceRecord.status;

                                    // Only allow hours selection for certain statuses
                                    if (
                                      status === "absent" ||
                                      status === "leave"
                                    ) {
                                      // Reset hours to 0 for absent/leave
                                      setHoursInputs((prev) => ({
                                        ...prev,
                                        [dateKey]: "0",
                                      }));
                                      markAttendance(
                                        dateKey,
                                        status,
                                        attendanceRecord?.clock_in_time || null,
                                        attendanceRecord?.clock_out_time ||
                                          null,
                                        attendanceRecord?.reason || "",
                                        0
                                      );
                                    } else {
                                      // Allow hours selection for present/WFH/Half Day
                                      markAttendance(
                                        dateKey,
                                        status,
                                        attendanceRecord?.clock_in_time || null,
                                        attendanceRecord?.clock_out_time ||
                                          null,
                                        attendanceRecord?.reason || "",
                                        parseInt(e.target.value)
                                      );
                                    }
                                  }
                                }}
                                disabled={
                                  attendanceRecord?.status === "absent" ||
                                  attendanceRecord?.status === "leave"
                                }
                              >
                                <option value="">Select Hours</option>
                                <option value="0">0 Hours</option>
                                <option value="4">4 Hours</option>
                                <option value="8">8 Hours</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="px-6 py-6 border-t border-deep-space-black/10">
                <div className="text-center">
                  <p className="text-sm text-deep-space-black/70 mb-6">
                    {loading
                      ? "Loading..."
                      : `${
                          attendance.filter((a) => {
                            const attendanceDate = new Date(a.date);
                            const weekStart = getWeekDates(new Date()).start;
                            const weekEnd = getWeekDates(new Date()).end;
                            return (
                              attendanceDate >= weekStart &&
                              attendanceDate <= weekEnd
                            );
                          }).length
                        } days marked this week`}
                  </p>

                  {/* Week Statistics */}
                  <div className="grid grid-cols-5 gap-6">
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-lumen-green mb-1">
                        {
                          attendance.filter(
                            (record) => record.status === "present"
                          ).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        Present
                      </div>
                    </div>
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-neon-violet mb-1">
                        {
                          attendance.filter(
                            (record) => record.status === "Work From Home"
                          ).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        WFH
                      </div>
                    </div>
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-coral-red mb-1">
                        {
                          attendance.filter(
                            (record) => record.status === "leave"
                          ).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        Leave
                      </div>
                    </div>
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-deep-space-black/70 mb-1">
                        {
                          attendance.filter(
                            (record) => record.status === "absent"
                          ).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        Absent
                      </div>
                    </div>
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-yellow mb-1">
                        {
                          attendance.filter(
                            (record) => record.status === "Half Day"
                          ).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        Half Day
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {view === "calendar" && (
            <div className="bg-iridescent-pearl rounded-xl shadow-md border border-deep-space-black/10 overflow-hidden">
              {/* Month Navigation */}
              <div className="flex justify-between items-center p-4 border-b border-deep-space-black/10">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setView("weekly")}
                    className="flex items-center px-3 py-2 text-sm font-medium text-deep-space-black bg-iridescent-pearl border border-deep-space-black/20 hover:bg-neon-violet/20 rounded-xl transition-colors duration-200"
                  >
                    <FaArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                  <button
                    onClick={goToPreviousMonth}
                    className="px-3 py-1 bg-iridescent-pearl border border-deep-space-black/20 rounded-xl hover:bg-neon-violet/20 text-deep-space-black"
                  >
                    Previous Month
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-deep-space-black">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  onClick={goToNextMonth}
                  className="px-3 py-1 bg-iridescent-pearl border border-deep-space-black/20 rounded-xl hover:bg-neon-violet/20 text-deep-space-black"
                >
                  Next Month
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1">
                  {/* Day headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-medium text-deep-space-black/70"
                      >
                        {day}
                      </div>
                    )
                  )}

                  {/* Calendar days */}
                  {generateCalendarDays().map(
                    ({ date, isCurrentMonth }, index) => {
                      // Format date as YYYY-MM-DD without timezone issues
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const formattedDate = `${year}-${month}-${day}`;
                      const attendanceRecord =
                        getAttendanceForDate(formattedDate);
                      const isToday =
                        date.toDateString() === new Date().toDateString();
                      const isPast = date < new Date().setHours(0, 0, 0, 0);

                      return (
                        <div
                          key={index}
                          className={`p-2 min-h-[80px] border border-deep-space-black/10 ${
                            !isCurrentMonth
                              ? "bg-neon-violet/10 text-deep-space-black/50"
                              : "bg-iridescent-pearl"
                          } ${isToday ? "ring-2 ring-lumen-green" : ""}`}
                        >
                          <div className="text-sm font-medium text-deep-space-black mb-1">
                            {date.getDate()}
                          </div>
                          {isCurrentMonth && (
                            <div className="space-y-1">
                              {attendanceRecord ? (
                                <div
                                  className={`text-xs px-1 py-0.5 rounded ${
                                    getStatusDisplay(attendanceRecord.status)
                                      .color
                                  }`}
                                >
                                  {attendanceRecord.status === "Work From Home"
                                    ? "WFH"
                                    : attendanceRecord.status
                                        .charAt(0)
                                        .toUpperCase() +
                                      attendanceRecord.status.slice(1)}
                                </div>
                              ) : (
                                <div className="text-xs text-deep-space-black/50">
                                  No attendance
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Attendance Summary for Calendar View */}
              <div className="px-6 py-6 border-t border-deep-space-black/10">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-6 text-deep-space-black">
                    Monthly Attendance Summary
                  </h3>

                  {/* Monthly Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-lumen-green mb-1">
                        {
                          attendance.filter((a) => {
                            const attendanceDate = new Date(a.date);
                            const monthStart =
                              getMonthDates(currentMonth).start;
                            const monthEnd = getMonthDates(currentMonth).end;
                            return (
                              attendanceDate >= monthStart &&
                              attendanceDate <= monthEnd &&
                              a.status === "present"
                            );
                          }).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        Present
                      </div>
                    </div>
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-neon-violet mb-1">
                        {
                          attendance.filter((a) => {
                            const attendanceDate = new Date(a.date);
                            const monthStart =
                              getMonthDates(currentMonth).start;
                            const monthEnd = getMonthDates(currentMonth).end;
                            return (
                              attendanceDate >= monthStart &&
                              attendanceDate <= monthEnd &&
                              a.status === "Work From Home"
                            );
                          }).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        WFH
                      </div>
                    </div>
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-coral-red mb-1">
                        {
                          attendance.filter((a) => {
                            const attendanceDate = new Date(a.date);
                            const monthStart =
                              getMonthDates(currentMonth).start;
                            const monthEnd = getMonthDates(currentMonth).end;
                            return (
                              attendanceDate >= monthStart &&
                              attendanceDate <= monthEnd &&
                              a.status === "leave"
                            );
                          }).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        Leave
                      </div>
                    </div>
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-deep-space-black/70 mb-1">
                        {
                          attendance.filter((a) => {
                            const attendanceDate = new Date(a.date);
                            const monthStart =
                              getMonthDates(currentMonth).start;
                            const monthEnd = getMonthDates(currentMonth).end;
                            return (
                              attendanceDate >= monthStart &&
                              attendanceDate <= monthEnd &&
                              a.status === "absent"
                            );
                          }).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        Absent
                      </div>
                    </div>
                    <div className="text-center bg-iridescent-pearl rounded-xl p-4 shadow-md border border-deep-space-black/10">
                      <div className="text-3xl font-bold text-yellow mb-1">
                        {
                          attendance.filter((a) => {
                            const attendanceDate = new Date(a.date);
                            const monthStart =
                              getMonthDates(currentMonth).start;
                            const monthEnd = getMonthDates(currentMonth).end;
                            return (
                              attendanceDate >= monthStart &&
                              attendanceDate <= monthEnd &&
                              a.status === "Half Day"
                            );
                          }).length
                        }
                      </div>
                      <div className="text-sm font-medium text-deep-space-black">
                        Half Day
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
