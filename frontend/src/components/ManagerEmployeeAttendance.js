import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaClock,
  FaHome,
  FaBed,
  FaCalendarAlt,
  FaCheck,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ManagerEmployeeAttendance = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (employeeId && employees.length > 0) {
      const employee = employees.find(
        (emp) => emp.id.toString() === employeeId
      );
      if (employee) {
        setSelectedEmployee(employee);
        fetchEmployeeAttendance(employee.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, employees]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/manager/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      } else if (response.status === 401) {
        toast.error("Please login again to continue");
        logout();
        navigate("/login");
      } else {
        toast.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    fetchEmployeeAttendance(employee.id);
  };

  const fetchEmployeeAttendance = async (empId) => {
    try {
      // Validate employee ID
      if (!empId || isNaN(empId)) {
        console.error("Invalid employee ID:", empId);
        toast.error("Invalid employee selected");
        setAttendance([]);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        toast.error("Please login to view attendance");
        setAttendance([]);
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/manager/employee/${empId}/attendance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || "Invalid employee ID";
        toast.error(message);
        setAttendance([]);
      } else if (response.status === 403) {
        toast.error(
          "You don't have permission to view this employee's attendance"
        );
        setAttendance([]);
      } else if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || "Employee not found";
        toast.error(message);
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
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "present":
        return {
          icon: <FaCheck className="text-deep-space-black" />,
          color: "bg-lumen-green text-deep-space-black",
          text: "Present",
        };
      case "Work From Home":
        return {
          icon: <FaHome className="text-white" />,
          color: "bg-neon-violet text-white",
          text: "Work From Home",
        };
      case "leave":
        return {
          icon: <FaBed className="text-white" />,
          color: "bg-neon-violet text-white",
          text: "Leave",
        };
      case "absent":
        return {
          icon: <span className="text-white">✗</span>,
          color: "bg-brand-coral text-white",
          text: "Absent",
        };
      case "Half Day":
        return {
          icon: <FaClock className="text-white" />,
          color: "bg-neon-violet text-white",
          text: "Half Day",
        };
      case "holiday":
        return {
          icon: <FaCalendarAlt className="text-white" />,
          color: "bg-neon-violet text-white",
          text: "Holiday",
        };
      default:
        return {
          icon: null,
          color: "bg-white text-deep-space-black border border-deep-space-black/20",
          text: status,
        };
    }
  };

  const formatTime = (time) => {
    if (!time) return "-";
    return time.substring(0, 5); // Show only HH:MM
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iridescent-pearl flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lumen-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iridescent-pearl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-deep-space-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/manager/dashboard")}
                className="text-deep-space-black/70 hover:text-deep-space-black hover:bg-neon-violet/20 transition-all duration-200 p-2 rounded-lg"
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-deep-space-black">
                Employee Attendance Management
              </h1>
              <span className="bg-lumen-green/20 text-deep-space-black text-xs font-medium px-2.5 py-0.5 rounded">
                Manager
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="bg-brand-coral text-white px-4 py-2 rounded-lg hover:bg-deep-space-black flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow border border-deep-space-black/10">
              <div className="px-6 py-4 border-b border-deep-space-black/10">
                <h2 className="text-lg font-medium text-deep-space-black">My Team</h2>
                <p className="text-sm text-deep-space-black/70">
                  Select an employee to view attendance
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-deep-space-black/70 text-center py-4">
                      No employees assigned
                    </p>
                  ) : (
                    employees.map((employee) => (
                      <button
                        key={employee.id}
                        onClick={() => handleEmployeeSelect(employee)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                          selectedEmployee?.id === employee.id
                            ? "border-lumen-green bg-lumen-green/10"
                            : "border-deep-space-black/20 hover:border-neon-violet hover:bg-neon-violet/10"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-lumen-green/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-deep-space-black">
                                {employee.first_name?.charAt(0)}
                                {employee.last_name?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-deep-space-black">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-deep-space-black/70">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="lg:col-span-2">
            {selectedEmployee ? (
              <div className="bg-white rounded-lg shadow border border-deep-space-black/10">
                <div className="px-6 py-4 border-b border-deep-space-black/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-medium text-deep-space-black">
                        Attendance - {selectedEmployee.first_name}{" "}
                        {selectedEmployee.last_name}
                      </h2>
                      <p className="text-sm text-deep-space-black/70">
                        Present week and future week attendance records (2 weeks
                        total)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-iridescent-pearl">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-deep-space-black/10">
                      {attendance.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-4 text-center text-deep-space-black/70"
                          >
                            No attendance records found for the present week and
                            future week
                          </td>
                        </tr>
                      ) : (
                        attendance.map((record) => {
                          const statusDisplay = getStatusDisplay(record.status);
                          return (
                            <tr key={record.id} className="hover:bg-iridescent-pearl/50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                                {new Date(record.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}
                                >
                                  {statusDisplay.icon && (
                                    <span className="mr-1">
                                      {statusDisplay.icon}
                                    </span>
                                  )}
                                  {statusDisplay.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                                {record.hours ? `${record.hours} Hours` : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                                {record.notes || "-"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-deep-space-black/10 p-8">
                <div className="text-center">
                  <FaCalendarAlt className="mx-auto h-12 w-12 text-deep-space-black/40" />
                  <h3 className="mt-2 text-sm font-medium text-deep-space-black">
                    No Employee Selected
                  </h3>
                  <p className="mt-1 text-sm text-deep-space-black/70">
                    Select an employee from the list to view their attendance
                    records.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerEmployeeAttendance;
