import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaUsers,
  FaDownload,
  FaTrash,
  FaSync,
} from "react-icons/fa";
import { format } from "date-fns";
import axios from "axios";
import toast from "react-hot-toast";

const HRAttendanceDetails = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAttendanceDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const fetchAttendanceDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/attendance/hr/details?month=${selectedMonth}&year=${selectedYear}`
      );
      setAttendanceRecords(response.data.records || []);
    } catch (error) {
      console.error("Error fetching attendance details:", error);
      toast.error("Failed to fetch attendance details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "Present":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "Work From Home":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "Leave":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return format(new Date(timeString), "hh:mm a");
  };

  const handleDeleteAttendance = async (id, employeeName, date) => {
    const confirmMessage = `Are you sure you want to delete the attendance record for ${employeeName} on ${formatDate(
      date
    )}?\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(id);
      await axios.delete(`/attendance/${id}`);
      toast.success("Attendance record deleted successfully");

      // Refresh the attendance data
      fetchAttendanceDetails();
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      toast.error(
        error.response?.data?.error || "Failed to delete attendance record"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadAttendance = () => {
    try {
      // Prepare CSV data
      const csvHeaders = [
        "Employee Name",
        "Employee Email",
        "Date",
        "Status",
        "Clock In",
        "Clock Out",
        "Reason",
      ];

      const csvData = filteredRecords.map((record) => [
        record.employee_name || "Unknown",
        record.employee_email || "",
        formatDate(record.date),
        record.status || "",
        formatTime(record.clock_in_time),
        formatTime(record.clock_out_time),
        record.reason || "",
      ]);

      // Convert to CSV string
      const csvContent = [
        csvHeaders.join(","),
        ...csvData.map((row) => row.map((field) => `"${field}"`).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      // Generate filename with current date and filters
      const currentDate = new Date().toISOString().split("T")[0];
      const monthName = format(
        new Date(selectedYear, selectedMonth - 1, 1),
        "MMMM"
      );
      const filename = `attendance_${monthName}_${selectedYear}_${currentDate}.csv`;

      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Attendance data downloaded as ${filename}`, {
        duration: 4000,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error downloading attendance data:", error);
      toast.error("Failed to download attendance data", {
        duration: 4000,
        position: "top-right",
      });
    }
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      !searchTerm ||
      record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      !selectedDate ||
      format(new Date(record.date), "yyyy-MM-dd") === selectedDate;

    const matchesStatus = !selectedStatus || record.status === selectedStatus;

    return matchesSearch && matchesDate && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Details</h2>
        <div className="flex space-x-3">
          <button
            onClick={fetchAttendanceDetails}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            title="Refresh data"
          >
            <FaSync className="mr-2" />
            Refresh
          </button>
          <button
            onClick={handleDownloadAttendance}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            title="Download attendance data as CSV"
          >
            <FaDownload className="mr-2" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Month/Year Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {format(new Date(2025, i, 1), "MMMM")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Employee
            </label>
            <input
              type="text"
              placeholder="Name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Leave">Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Count */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FaUsers className="text-gray-400" />
            <span className="text-sm text-gray-600">
              Showing {filteredRecords.length} of {attendanceRecords.length}{" "}
              records
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <FaCalendarAlt className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Attendance Records
            </h3>
            <p className="text-gray-500">
              No attendance records found for the selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr
                    key={`${record.employee_id}-${record.date}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee_name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.employee_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(record.status)}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.clock_in_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.clock_out_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.reason || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() =>
                          handleDeleteAttendance(
                            record.id,
                            record.employee_name,
                            record.date
                          )
                        }
                        disabled={deletingId === record.id}
                        className={`font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-3 py-2 transition-colors duration-200 ${
                          deletingId === record.id
                            ? "text-gray-400 cursor-not-allowed bg-gray-100"
                            : "text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 hover:border-red-300"
                        }`}
                        title="Delete attendance record"
                      >
                        {deletingId === record.id ? (
                          "Deleting..."
                        ) : (
                          <>
                            <FaTrash className="inline mr-1" />
                            Delete
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAttendanceDetails;
