import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaCalendarAlt,
  FaEdit,
  FaPlus,
  FaTrash,
  FaCheck,
  FaHome,
  FaTimes,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ManagerDashboard = () => {
  const [dashboard, setDashboard] = useState({});
  const [team, setTeam] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/manager/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      } else {
        toast.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch team members
  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/manager/team", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeam(data.team);
      } else {
        toast.error("Failed to fetch team data");
      }
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Failed to fetch team data");
    }
  };

  // Fetch team attendance
  const fetchTeamAttendance = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/manager/team-attendance?start_date=${selectedDateRange.start_date}&end_date=${selectedDateRange.end_date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance);
      } else {
        toast.error("Failed to fetch team attendance");
      }
    } catch (error) {
      console.error("Error fetching team attendance:", error);
      toast.error("Failed to fetch team attendance");
    }
  };

  // Fetch attendance summary
  const fetchAttendanceSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/manager/attendance-summary?start_date=${selectedDateRange.start_date}&end_date=${selectedDateRange.end_date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        toast.error("Failed to fetch attendance summary");
      }
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
      toast.error("Failed to fetch attendance summary");
    }
  };

  // Fetch available employees
  const fetchAvailableEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/manager/available-employees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableEmployees(data.available_employees);
      } else {
        toast.error("Failed to fetch available employees");
      }
    } catch (error) {
      console.error("Error fetching available employees:", error);
      toast.error("Failed to fetch available employees");
    }
  };

  // Add team member
  const addTeamMember = async (employeeId, mappingType = "primary") => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/manager/add-team-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employee_id: employeeId,
          mapping_type: mappingType,
        }),
      });

      if (response.ok) {
        toast.success("Team member added successfully");
        fetchTeam();
        fetchAvailableEmployees();
        setShowAddMember(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add team member");
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    }
  };

  // Remove team member
  const removeTeamMember = async (employeeId) => {
    if (!window.confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/manager/remove-team-member/${employeeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Team member removed successfully");
        fetchTeam();
        fetchAvailableEmployees();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove team member");
      }
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
  };

  // Edit employee attendance
  const editEmployeeAttendance = async (
    attendanceId,
    status,
    checkInTime = null,
    checkOutTime = null,
    notes = ""
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/attendance/edit-employee-attendance/${attendanceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            notes,
          }),
        }
      );

      if (response.ok) {
        toast.success("Attendance updated successfully");
        fetchTeamAttendance();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update attendance");
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance");
    }
  };

  // Add attendance for employee
  const addEmployeeAttendance = async (
    employeeId,
    date,
    status,
    checkInTime = null,
    checkOutTime = null,
    notes = ""
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/attendance/add-employee-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employee_id: employeeId,
          date,
          status,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          notes,
        }),
      });

      if (response.ok) {
        toast.success("Attendance added successfully");
        fetchTeamAttendance();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add attendance");
      }
    } catch (error) {
      console.error("Error adding attendance:", error);
      toast.error("Failed to add attendance");
    }
  };

  // Get status display
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

  // Initialize component
  useEffect(() => {
    fetchDashboard();
    fetchTeam();
  }, []);

  useEffect(() => {
    fetchTeamAttendance();
    fetchAttendanceSummary();
  }, [selectedDateRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manager Dashboard</h2>
        <button
          onClick={() => {
            fetchAvailableEmployees();
            setShowAddMember(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.team_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaCheck className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.today_attendance?.present_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaHome className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">WFH Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.today_attendance?.wfh_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FaTimes className="text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leave Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.today_attendance?.leave_count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Date Range:
          </label>
          <input
            type="date"
            value={selectedDateRange.start_date}
            onChange={(e) =>
              setSelectedDateRange({
                ...selectedDateRange,
                start_date: e.target.value,
              })
            }
            className="border border-gray-300 rounded px-3 py-2"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={selectedDateRange.end_date}
            onChange={(e) =>
              setSelectedDateRange({
                ...selectedDateRange,
                end_date: e.target.value,
              })
            }
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Team Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {team.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.emp_id || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.department || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {member.employment_type || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => removeTeamMember(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Attendance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WFH
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Half Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Hours
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.department}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.present_days || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.wfh_days || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.leave_days || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.absent_days || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.half_days || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.total_days || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.avg_hours || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      {dashboard.recent_activities &&
        dashboard.recent_activities.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Recent Activities</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboard.recent_activities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-full ${
                        getStatusDisplay(activity.status).color
                      }`}
                    >
                      {getStatusDisplay(activity.status).icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.first_name} {activity.last_name} marked{" "}
                        {activity.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()} •{" "}
                        {new Date(activity.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Add Team Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee
                </label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={selectedEmployee || ""}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Choose an employee</option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} -{" "}
                      {employee.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedEmployee) {
                      addTeamMember(selectedEmployee);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!selectedEmployee}
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
