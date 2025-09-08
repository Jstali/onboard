import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaUsers,
  FaCalendarAlt,
  FaClock,
  FaBed,
  FaArrowLeft,
  FaEye,
  FaUser,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ManagerDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [managerProfile, setManagerProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [leaveDetails, setLeaveDetails] = useState({});
  const [showTooltip, setShowTooltip] = useState({
    employeeId: null,
    type: null, // 'taken' or 'remaining'
    position: { x: 0, y: 0 }
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      

      const response = await fetch(
        "/api/manager/dashboard",
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
  }, [navigate, logout]);

  const fetchManagerProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
<<<<<<< HEAD
        `/api/leave/balances/${employeeId}`,
=======
        "http://localhost:5001/api/manager/profile",
>>>>>>> 5778a8ccfc09c428987bb18632aaabb490cd2951
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setManagerProfile(data.manager || null);
      } else if (response.status === 401) {
        toast.error("Please login again to continue");
        logout();
        navigate("/login");
      } else {
        console.error("Failed to fetch manager profile");
      }
    } catch (error) {
      console.error("Error fetching manager profile:", error);
    }
  }, [navigate, logout]);

  const fetchLeaveDetails = useCallback(async (employeeId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `http://localhost:5001/api/manager/employee/${employeeId}/leave-details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLeaveDetails(prev => ({
          ...prev,
          [employeeId]: data
        }));
      }
    } catch (error) {
      console.error("Error fetching leave details:", error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchManagerProfile();
  }, [fetchEmployees, fetchManagerProfile]);


  const handleMouseEnter = (employeeId, type) => {
    setShowTooltip({ employeeId, type, position: { x: 0, y: 0 } });
    if (!leaveDetails[employeeId]) {
      fetchLeaveDetails(employeeId);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip({ employeeId: null, type: null, position: { x: 0, y: 0 } });
  };


  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleViewAttendance = (employee) => {
    setSelectedEmployee(employee);
    setShowAttendanceModal(true);
  };

  const handleNavigateToAttendance = () => {
    navigate("/manager/attendance");
  };

  const handleNavigateToMyAttendance = () => {
    console.log("🔍 Navigating to My Attendance");
    console.log("🔍 Current user role:", user?.role);
    console.log("🔍 Current user:", user);
    navigate("/manager/my-attendance");
  };

  const handleNavigateToLeaveRequests = () => {
    navigate("/manager/leave-requests");
  };

  const handleNavigateToManagerLeaveRequest = () => {
    navigate("/manager/leave-request");
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
              <h1 className="brand-heading-md text-deep-space-black">
                Manager Dashboard
              </h1>
              <span className="bg-lumen-green/20 text-deep-space-black text-xs font-medium px-2.5 py-0.5 rounded">
                Manager
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="bg-white border border-deep-space-black/20 text-deep-space-black px-4 py-2 rounded-lg hover:bg-neon-violet hover:text-white flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
              >
                <FaUser />
                <span>Profile</span>
              </button>
              <button
                onClick={handleNavigateToAttendance}
                className="bg-lumen-green text-deep-space-black px-4 py-2 rounded-lg hover:bg-neon-violet flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
              >
                <FaClock />
                <span>Attendance Management</span>
              </button>
              <button
                onClick={handleNavigateToMyAttendance}
                className="bg-neon-violet text-white px-4 py-2 rounded-lg hover:bg-lumen-green hover:text-deep-space-black flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
              >
                <FaClock />
                <span>My Attendance</span>
              </button>
              <button
                onClick={handleNavigateToLeaveRequests}
                className="bg-lumen-green text-deep-space-black px-4 py-2 rounded-lg hover:bg-neon-violet flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
              >
                <FaCalendarAlt />
                <span>Leave Management</span>
              </button>
              <button
                onClick={handleNavigateToManagerLeaveRequest}
                className="bg-neon-violet text-white px-4 py-2 rounded-lg hover:bg-lumen-green hover:text-deep-space-black flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
              >
                <FaCalendarAlt />
                <span>Leave Request</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-brand-coral text-white px-4 py-2 rounded-lg hover:bg-deep-space-black flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow border border-deep-space-black/10 p-6 hover:shadow-md hover:border-neon-violet/30 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-lumen-green/20 text-deep-space-black">
                <FaUsers className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="brand-body-sm text-deep-space-black/70">
                  Total Employees
                </p>
                <p className="brand-heading-sm text-deep-space-black">
                  {employees.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-deep-space-black/10 p-6 hover:shadow-md hover:border-neon-violet/30 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-neon-violet/20 text-deep-space-black">
                <FaCalendarAlt className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-deep-space-black/70">
                  Active Today
                </p>
                <p className="text-2xl font-semibold text-deep-space-black">
                  {
                    employees.filter((emp) => emp.employee_status === "active")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-deep-space-black/10 p-6 hover:shadow-md hover:border-neon-violet/30 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand-coral/20 text-deep-space-black">
                <FaBed className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-deep-space-black/70">On Leave</p>
                <p className="text-2xl font-semibold text-deep-space-black">
                  {employees.filter((emp) => emp.leaves_taken > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow border border-deep-space-black/10">
          <div className="px-6 py-4 border-b border-deep-space-black/10">
            <h2 className="text-lg font-medium text-deep-space-black">My Team</h2>
            <p className="text-sm text-deep-space-black/70">
              Manage your team's attendance and leave
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-iridescent-pearl">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Employment Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Leaves Taken
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Leaves Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-deep-space-black/10">
                {employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-deep-space-black/70"
                    >
                      No employees assigned to your team
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-iridescent-pearl/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-lumen-green/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-deep-space-black">
                                {employee.first_name?.charAt(0)}
                                {employee.last_name?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-deep-space-black">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-deep-space-black/70">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                        {employee.department || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                        {employee.employment_type || "N/A"}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative cursor-pointer"
                        onMouseEnter={() =>
                          handleMouseEnter(employee.id, "taken")
                        }
                        onMouseLeave={handleMouseLeave}
                      >
                        {employee.leaves_taken || 0}
                        {showTooltip.employeeId === employee.id &&
                          showTooltip.type === "taken" && (
                            <div className="absolute z-50 bg-deep-space-black text-white text-xs rounded-lg p-3 shadow-lg top-full left-1/2 transform -translate-x-1/2 mt-2 min-w-64 border border-lumen-green/20">
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-deep-space-black rotate-45"></div>
                              <div className="font-semibold mb-2">
                                Leaves Taken:
                              </div>
                              {leaveDetails[employee.id]?.leaveBalances?.map((balance, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between mb-1"
                                >
                                  <span>{balance.leave_type}:</span>
                                  <span className="font-medium">
                                    {balance.leaves_taken || 0}
                                  </span>
                                </div>
                              )) || <div>Loading...</div>}
                            </div>
                          )}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative cursor-pointer"
                        onMouseEnter={() =>
                          handleMouseEnter(employee.id, "remaining")
                        }
                        onMouseLeave={handleMouseLeave}
                      >
                        {employee.leaves_remaining || 0}
                        {showTooltip.employeeId === employee.id &&
                          showTooltip.type === "remaining" && (
                            <div className="absolute z-50 bg-deep-space-black text-white text-xs rounded-lg p-3 shadow-lg top-full left-1/2 transform -translate-x-1/2 mt-2 min-w-64 border border-lumen-green/20">
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-deep-space-black rotate-45"></div>
                              <div className="font-semibold mb-2">
                                Leaves Remaining:
                              </div>
                              {leaveDetails[employee.id]?.leaveBalances?.map((balance, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between mb-1"
                                >
                                  <span>{balance.leave_type}:</span>
                                  <span className="font-medium">
                                    {balance.leaves_remaining || 0}
                                  </span>
                                </div>
                              )) || <div>Loading...</div>}
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.employee_status === "active"
                              ? "bg-lumen-green text-deep-space-black"
                              : "bg-brand-coral text-white"
                          }`}
                        >
                          {employee.employee_status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewAttendance(employee)}
                          className="text-neon-violet hover:text-lumen-green mr-3 flex items-center space-x-1 transition-colors duration-200"
                        >
                          <FaEye />
                          <span>View Attendance</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-deep-space-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-deep-space-black/10 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-deep-space-black">
                  Attendance - {selectedEmployee.first_name}{" "}
                  {selectedEmployee.last_name}
                </h3>
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="text-deep-space-black/70 hover:text-deep-space-black transition-colors duration-200"
                >
                  <FaArrowLeft />
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm text-deep-space-black/70 mb-4">
                  Click "View Attendance" to see detailed attendance records
                </p>
                <button
                  onClick={() => {
                    setShowAttendanceModal(false);
                    navigate(`/manager/attendance/${selectedEmployee.id}`);
                  }}
                  className="bg-lumen-green text-deep-space-black px-4 py-2 rounded-lg hover:bg-neon-violet transition-all duration-200 transform hover:scale-105"
                >
                  View Detailed Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-deep-space-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-deep-space-black/10 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="brand-subheading-md text-deep-space-black">Manager Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-deep-space-black/70 hover:text-deep-space-black transition-colors duration-200"
                >
                  <FaArrowLeft />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Profile Avatar */}
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-lumen-green/20 flex items-center justify-center">
                    <span className="text-3xl font-bold text-deep-space-black">
                      {user?.first_name?.charAt(0) || 'M'}
                      {user?.last_name?.charAt(0) || 'D'}
                    </span>
                  </div>
                  <div>
                    <h4 className="brand-subheading-sm text-deep-space-black">
                      {user?.first_name} {user?.last_name}
                    </h4>
                    <p className="brand-body-sm text-deep-space-black/70">Manager</p>
                    <p className="brand-body-sm text-deep-space-black/70">{user?.email}</p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="brand-body-sm text-deep-space-black/70 block mb-1">Manager ID</label>
                      <p className="brand-body-md text-deep-space-black">
                        {managerProfile?.manager_id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="brand-body-sm text-deep-space-black/70 block mb-1">Department</label>
                      <p className="brand-body-md text-deep-space-black">
                        {managerProfile?.department || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="brand-body-sm text-deep-space-black/70 block mb-1">Designation</label>
                      <p className="brand-body-md text-deep-space-black">
                        {managerProfile?.designation || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="brand-body-sm text-deep-space-black/70 block mb-1">Team Size</label>
                      <p className="brand-body-md text-deep-space-black">
                        {employees.length} employee{employees.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <label className="brand-body-sm text-deep-space-black/70 block mb-1">Active Employees</label>
                      <p className="brand-body-md text-deep-space-black">
                        {employees.filter((emp) => emp.employee_status === "active").length}
                      </p>
                    </div>
                    <div>
                      <label className="brand-body-sm text-deep-space-black/70 block mb-1">Status</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lumen-green/20 text-deep-space-black">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-deep-space-black/10">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="bg-white border border-deep-space-black/20 text-deep-space-black px-4 py-2 rounded-lg hover:bg-iridescent-pearl transition-all duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      // Navigate to profile edit page or show edit form
                      toast.info("Profile editing feature coming soon!");
                    }}
                    className="bg-lumen-green text-deep-space-black px-4 py-2 rounded-lg hover:bg-neon-violet hover:text-white transition-all duration-200 transform hover:scale-105"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
