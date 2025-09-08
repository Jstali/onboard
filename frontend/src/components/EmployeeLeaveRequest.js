import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { FaArrowLeft } from "react-icons/fa";

const EmployeeLeaveRequest = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveTypeBalances, setLeaveTypeBalances] = useState([]);
  const [compOffBalance, setCompOffBalance] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    halfDay: false,
    reason: "",
  });

  useEffect(() => {
    fetchLeaveTypes();
    fetchSystemSettings();
    if (token) {
      fetchLeaveBalance();
      fetchLeaveTypeBalances();
      fetchMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get("/leave/types");
      setLeaveTypes(response.data);
    } catch (error) {
      console.error("Error fetching leave types:", error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      // For employees, we can fetch basic system settings without auth if needed
      // Or we can make a public endpoint for basic settings
      const response = await axios.get("/leave/system-info");
      setSystemSettings(response.data);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      // Set default values if API fails
      setSystemSettings({
        allow_half_day: true,
        total_annual_leaves: 15,
      });
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      if (!token) {
        console.error("No token available");
        return;
      }

      const response = await axios.get("/leave/balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLeaveBalance(response.data);
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      // Set default values if fetch fails
      setLeaveBalance({
        total_allocated: 15,
        leaves_taken: 0,
        leaves_remaining: 15,
        year: new Date().getFullYear(),
      });
    }
  };

  const fetchLeaveTypeBalances = async () => {
    try {
      if (!token) {
        console.error("No token available");
        return;
      }

      const response = await axios.get("/leave/my-leave-type-balances", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLeaveTypeBalances(response.data.leaveTypeBalances || []);
    } catch (error) {
      console.error("Error fetching leave type balances:", error);
      // Set default values if fetch fails
      setLeaveTypeBalances([
        {
          leave_type: "Earned/Annual Leave",
          total_allocated: 15,
          leaves_taken: 0,
          leaves_remaining: 15,
        },
        {
          leave_type: "Sick Leave",
          total_allocated: 6,
          leaves_taken: 0,
          leaves_remaining: 6,
        },
        {
          leave_type: "Casual Leave",
          total_allocated: 6,
          leaves_taken: 0,
          leaves_remaining: 6,
        },
      ]);
    }
  };

  const fetchMyRequests = async () => {
    try {
      if (!token) {
        console.error("No token available");
        return;
      }

      const response = await axios.get("/leave/my-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMyRequests(response.data);
    } catch (error) {
      console.error("Error fetching my requests:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const calculateTotalDays = () => {
    if (!formData.fromDate) return 0;

    // If no toDate is provided, it's a single day leave
    if (!formData.toDate) {
      return formData.halfDay ? 0.5 : 1;
    }

    const start = new Date(formData.fromDate);
    const end = new Date(formData.toDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return formData.halfDay ? diffDays - 0.5 : diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const totalDays = calculateTotalDays();

      if (!leaveBalance) {
        setMessage("Please wait while we load your leave balance...");
        setLoading(false);
        return;
      }

      // Validate based on leave type
      if (formData.leaveType === "Unpaid Leave") {
        // Unpaid Leave: No balance validation needed
        console.log("🔍 Unpaid Leave - No balance validation required");
      } else if (formData.leaveType === "Comp Off") {
        // Comp Off: Check Comp Off balance (we'll need to implement this)
        console.log("🔍 Comp Off - Comp Off balance validation needed");
        // For now, allow Comp Off requests (balance will be checked on approval)
      } else {
        // Paid Leave, Privilege Leave, Sick Leave, etc.: Check annual leave balance
        if (totalDays > leaveBalance.leaves_remaining) {
          setMessage(
            `Insufficient leave balance. You have ${leaveBalance.leaves_remaining} days remaining, but requesting ${totalDays} days.`
          );
          setLoading(false);
          return;
        }
      }

      const requestData = {
        ...formData,
        toDate: formData.toDate || null,
        totalDays,
      };

      console.log("🔍 Frontend - Data being sent:", requestData);
      console.log("🔍 Frontend - Token available:", !!token);

      await axios.post("/leave/submit", requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000, // 15 second timeout for leave submission
      });

      setMessage("Leave request submitted successfully!");
      setFormData({
        leaveType: "",
        fromDate: "",
        toDate: "",
        halfDay: false,
        reason: "",
      });

      // Refresh data
      fetchLeaveBalance();
      fetchMyRequests();
    } catch (error) {
      console.error("Error submitting leave request:", error);
      setMessage(
        error.response?.data?.error || "Failed to submit leave request"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "text-deep-space-black bg-lumen-green rounded-full";
      case "Rejected":
        return "text-white bg-brand-coral rounded-full";
      case "Manager Approved":
        return "text-white bg-neon-violet rounded-full";
      case "Pending Manager Approval":
        return "text-deep-space-black bg-brand-yellow rounded-full";
      default:
        return "text-deep-space-black bg-white border-2 border-deep-space-black rounded-full";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "-";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-iridescent-pearl min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-deep-space-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-deep-space-black/70 hover:text-lumen-green transition-colors duration-200 mr-4"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h2 className="text-2xl font-bold text-deep-space-black">
              Leave Request Form
            </h2>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Leave Balance */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-deep-space-black/10">
          {leaveBalance ? (
            <div className="bg-white border border-deep-space-black/10 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-deep-space-black mb-4">
                Your Leave Balance
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <p className="text-2xl font-bold text-lumen-green">
                    {leaveBalance.total_allocated}
                  </p>
                  <p className="text-sm text-deep-space-black/70">
                    Total Allocated
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow">
                    {leaveBalance.leaves_taken}
                  </p>
                  <p className="text-sm text-deep-space-black/70">
                    Leaves Taken
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-lumen-green">
                    {leaveBalance.leaves_remaining}
                  </p>
                  <p className="text-sm text-deep-space-black/70">Remaining</p>
                </div>
              </div>

              {/* Detailed Leave Type Balances */}
              <div className="pt-4 border-t border-deep-space-black/10">
                <h4 className="text-sm font-semibold text-deep-space-black mb-3">
                  Leave Type Breakdown:
                </h4>
                <div className="space-y-3">
                  {leaveTypeBalances.map((balance, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-3 border border-deep-space-black/10"
                    >
                      <h5 className="text-sm font-semibold text-deep-space-black mb-2">
                        {balance.leave_type}
                      </h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-deep-space-black/70">
                            Allocated:
                          </span>
                          <span className="font-semibold text-lumen-green">
                            {balance.total_allocated}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-deep-space-black/70">
                            Taken:
                          </span>
                          <span className="font-semibold text-yellow">
                            {balance.leaves_taken}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-deep-space-black/70">
                            Remaining:
                          </span>
                          <span className="font-semibold text-lumen-green">
                            {balance.leaves_remaining}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Side - Leave Request Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-deep-space-black/10">
          <h3 className="text-xl font-semibold text-deep-space-black mb-6">
            Submit Leave Request
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-deep-space-black mb-2">
                  Leave Type *
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  required
                  disabled={leaveTypes.length === 0}
                  className="w-full px-3 py-2 border border-deep-space-black/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-lumen-green bg-white disabled:bg-gray-50 disabled:cursor-not-allowed text-deep-space-black"
                >
                  <option value="">
                    {leaveTypes.length === 0
                      ? "Loading leave types..."
                      : "Select Leave Type"}
                  </option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.type_name}>
                      {type.type_name}
                    </option>
                  ))}
                </select>
                {formData.leaveType && (
                  <div className="mt-2">
                    <div className="flex items-center mb-1">
                      {leaveTypes.find(
                        (t) => t.type_name === formData.leaveType
                      )?.color && (
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{
                            backgroundColor: leaveTypes.find(
                              (t) => t.type_name === formData.leaveType
                            )?.color,
                          }}
                        ></div>
                      )}
                      <span className="text-sm text-deep-space-black/70">
                        {
                          leaveTypes.find(
                            (t) => t.type_name === formData.leaveType
                          )?.description
                        }
                      </span>
                    </div>
                    {leaveTypes.find((t) => t.type_name === formData.leaveType)
                      ?.max_days && (
                      <div className="text-xs text-deep-space-black bg-yellow px-2 py-1 rounded-xl">
                        Maximum allowed:{" "}
                        {
                          leaveTypes.find(
                            (t) => t.type_name === formData.leaveType
                          )?.max_days
                        }{" "}
                        days per year
                      </div>
                    )}
                  </div>
                )}
              </div>

              {systemSettings?.allow_half_day && (
                <div>
                  <label className="block text-sm font-medium text-deep-space-black mb-2">
                    Half Day
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="halfDay"
                      checked={formData.halfDay}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-lumen-green focus:ring-lumen-green border-deep-space-black/20 rounded"
                    />
                    <label className="ml-2 text-sm text-deep-space-black/70">
                      Check if this is a half-day leave
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-deep-space-black mb-2">
                  From Date *
                </label>
                <input
                  type="date"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-deep-space-black/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-lumen-green bg-white text-deep-space-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-space-black mb-2">
                  To Date (Optional)
                </label>
                <input
                  type="date"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleInputChange}
                  min={
                    formData.fromDate || new Date().toISOString().split("T")[0]
                  }
                  className="w-full px-3 py-2 border border-deep-space-black/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-lumen-green bg-white text-deep-space-black"
                />
                <p className="text-xs text-deep-space-black/60 mt-1">
                  Leave empty for single day leave
                </p>
              </div>
            </div>

            {formData.fromDate && (
              <div className="bg-white border border-deep-space-black/10 rounded-xl p-4">
                <p className="text-sm text-deep-space-black">
                  <strong>Total Leave Days:</strong> {calculateTotalDays()}{" "}
                  {calculateTotalDays() === 1 ? "day" : "days"}
                  {formData.halfDay && " (including half-day adjustment)"}
                  {!formData.toDate && " - Single day leave"}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-deep-space-black mb-2">
                Reason *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Please provide a detailed reason for your leave request..."
                className="w-full px-3 py-2 border border-deep-space-black/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-lumen-green bg-white text-deep-space-black placeholder-deep-space-black/50"
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-xl ${
                  message.includes("successfully")
                    ? "bg-lumen-green text-deep-space-black border border-lumen-green"
                    : "bg-brand-coral text-white border border-brand-coral"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-lumen-green text-deep-space-black px-6 py-2 rounded-xl hover:bg-neon-violet focus:outline-none focus:ring-2 focus:ring-lumen-green disabled:opacity-50 font-medium transition-colors duration-150"
              >
                {loading ? "Submitting..." : "Submit Leave Request"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* My Leave Requests History */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-deep-space-black/10">
        <h3 className="text-xl font-bold text-deep-space-black mb-4">
          My Leave Requests
        </h3>

        {myRequests.length === 0 ? (
          <p className="text-deep-space-black/60 text-center py-8">
            No leave requests found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-deep-space-black/10 bg-white rounded-xl overflow-hidden shadow-md">
              <thead className="bg-white border-b border-deep-space-black/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-deep-space-black uppercase tracking-wider bg-white rounded-tl-xl">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-deep-space-black uppercase tracking-wider bg-white">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-deep-space-black uppercase tracking-wider bg-white">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-deep-space-black uppercase tracking-wider bg-white">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-deep-space-black uppercase tracking-wider bg-white">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-deep-space-black uppercase tracking-wider bg-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-deep-space-black uppercase tracking-wider bg-white rounded-tr-xl">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-deep-space-black/10">
                {myRequests.map((request, index) => (
                  <tr
                    key={request.id}
                    className={`hover:bg-neon-violet/10 transition-colors duration-200 ${
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap bg-inherit">
                      <div className="flex items-center">
                        {leaveTypes.find(
                          (t) => t.type_name === request.leave_type
                        )?.color && (
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: leaveTypes.find(
                                (t) => t.type_name === request.leave_type
                              )?.color,
                            }}
                          ></div>
                        )}
                        <span className="text-sm text-deep-space-black">
                          {request.leave_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black bg-inherit">
                      {formatDate(request.from_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black bg-inherit">
                      {request.to_date ? formatDate(request.to_date) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black bg-inherit">
                      {request.total_leave_days}
                      {request.half_day && " (½ day)"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap bg-inherit">
                      <div className="flex flex-wrap gap-1">
                        {request.manager1_name && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-lumen-green/20 text-lumen-green border border-lumen-green/30">
                            {request.manager1_name}
                          </span>
                        )}
                        {request.manager2_name && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-neon-violet/20 text-neon-violet border border-neon-violet/30">
                            {request.manager2_name}
                          </span>
                        )}
                        {request.manager3_name && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-brand-yellow/20 text-deep-space-black border border-brand-yellow/30">
                            {request.manager3_name}
                          </span>
                        )}
                        {!request.manager1_name &&
                          !request.manager2_name &&
                          !request.manager3_name && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-deep-space-black/10 text-deep-space-black/60 border border-deep-space-black/20">
                              Not Assigned
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap bg-inherit">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black/70 bg-inherit">
                      {formatDate(request.created_at)}
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

export default EmployeeLeaveRequest;
