import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaCheck, FaTimes, FaEdit } from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const HRLeaveManagement = () => {
  const { user, token } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch leave requests from backend
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      // Use axios defaults (set by AuthContext)
      const response = await axios.get(
        "http://localhost:5001/api/hr/leave-requests"
      );
      console.log("✅ Leave requests fetched:", response.data);
      setLeaveRequests(response.data.leaveRequests || []);
    } catch (error) {
      console.error("❌ Error fetching leave requests:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch leave requests";
      toast.error(errorMessage);

      // Debug: Log full error details
      if (error.response) {
        console.log("Response status:", error.response.status);
        console.log("Response data:", error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle approve/reject action
  const handleAction = async (requestId, status) => {
    try {
      setUpdatingId(requestId);

      console.log(
        "🎯 Updating leave request:",
        requestId,
        "to status:",
        status
      );

      // Use axios defaults (set by AuthContext)
      await axios.put(
        `http://localhost:5001/api/hr/leave-requests/${requestId}`,
        { status }
      );

      console.log("✅ Leave request updated successfully");

      // Update local state
      setLeaveRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? { ...request, status } : request
        )
      );

      toast.success(`Leave request ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("❌ Error updating leave request:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        `Failed to ${status.toLowerCase()} leave request`;
      toast.error(errorMessage);

      // Debug: Log full error details
      if (error.response) {
        console.log("Response status:", error.response.status);
        console.log("Response data:", error.response.data);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Calculate total days between two dates
  const calculateTotalDays = (startDate, endDate) => {
    if (!endDate || endDate === startDate) {
      return 1; // Single day leave
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "Approved":
        return `${baseClasses} bg-brand-green text-brand-black border border-brand-green/40`;
      case "Rejected":
        return `${baseClasses} bg-brand-red text-brand-black border border-brand-red/40`;
      case "Pending":
        return `${baseClasses} bg-brand-yellow text-brand-black border border-brand-yellow/40`;
      default:
        return `${baseClasses} bg-brand-pearl text-brand-black border border-brand-black/10`;
    }
  };

  // Get action button styling
  const getActionButtonStyle = (type) => {
    const baseClasses =
      "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2";

    switch (type) {
      case "approve":
        return `${baseClasses} bg-brand-green hover:bg-hover-primary text-brand-black shadow`;
      case "reject":
        return `${baseClasses} bg-brand-red hover:bg-hover-danger text-brand-black shadow`;
      case "change":
        return `${baseClasses} bg-brand-violet hover:bg-hover-secondary text-brand-black shadow`;
      default:
        return `${baseClasses} bg-brand-pearl border border-brand-black/20 text-brand-black shadow`;
    }
  };

  useEffect(() => {
    // Check if user is authenticated and is HR
    if (!token || !user || user.role !== "hr") {
      console.error("❌ User not authenticated or not HR:", {
        token: !!token,
        user: user?.role,
      });
      toast.error("Access denied. HR role required.");
      return;
    }

    console.log("✅ User authenticated as HR:", user);
    console.log("🔐 Token available:", !!token);
    console.log("👤 User role:", user.role);

    // Check axios defaults
    console.log(
      "📡 Axios Authorization header:",
      axios.defaults.headers.common["Authorization"]
    );

    fetchLeaveRequests();
  }, [token, user]);

  // Check authentication first
  if (!token || !user || user.role !== "hr") {
    return (
      <div className="flex items-center justify-center min-h-96 bg-brand-pearl">
        <div className="text-center">
          <div className="text-2xl text-brand-red mb-4">🔒 Access Denied</div>
          <div className="text-brand-black/70">
            You must be logged in as HR to access this page.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-brand-pearl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="bg-brand-pearl rounded-xl shadow-md p-6 border border-brand-black/10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-black mb-2">
          Leave Management
        </h1>
        <p className="text-brand-black/70">
          Manage and approve employee leave requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-pearl p-4 rounded-lg border border-brand-black/10 shadow-sm">
          <div className="text-2xl font-bold text-brand-yellow">
            {leaveRequests.filter((r) => r.status === "Pending").length}
          </div>
          <div className="text-sm text-brand-black">Pending</div>
        </div>
        <div className="bg-brand-pearl p-4 rounded-lg border border-brand-black/10 shadow-sm">
          <div className="text-2xl font-bold text-brand-green">
            {leaveRequests.filter((r) => r.status === "Approved").length}
          </div>
          <div className="text-sm text-brand-black">Approved</div>
        </div>
        <div className="bg-brand-pearl p-4 rounded-lg border border-brand-black/10 shadow-sm">
          <div className="text-2xl font-bold text-brand-red">
            {leaveRequests.filter((r) => r.status === "Rejected").length}
          </div>
          <div className="text-sm text-brand-black">Rejected</div>
        </div>
        <div className="bg-brand-pearl p-4 rounded-lg border border-brand-black/10 shadow-sm">
          <div className="text-2xl font-bold text-brand-black/70">
            {leaveRequests.length}
          </div>
          <div className="text-sm text-brand-black">Total</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-brand-pearl rounded-xl overflow-hidden shadow-md border border-brand-black/10">
          <thead className="bg-brand-pearl border-b border-brand-black/10">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Leave Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Manager
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-black/10">
            {leaveRequests.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-brand-black/60"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-2">📋</div>
                    <div className="text-lg font-medium">
                      No leave requests found
                    </div>
                    <div className="text-sm">
                      All leave requests have been processed
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              leaveRequests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:bg-ui-secondary transition-colors duration-150"
                >
                  {/* Employee Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-brand-green/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-brand-green">
                            {request.employee_name?.charAt(0) || "E"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-brand-black">
                          {request.employee_name || "N/A"}
                        </div>
                        <div className="text-sm text-brand-black/70">
                          ID: {request.employee_id || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Leave Details */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-brand-black">
                      <div className="font-medium text-brand-blue mb-1">
                        {request.leave_type || "N/A"}
                      </div>
                      <div className="text-brand-black/70">
                        {formatDate(request.start_date)}
                        {request.end_date &&
                        request.end_date !== request.start_date
                          ? ` - ${formatDate(request.end_date)}`
                          : ""}
                      </div>
                      <div className="text-xs text-brand-black/60 mt-1">
                        {calculateTotalDays(
                          request.start_date,
                          request.end_date
                        )}{" "}
                        days
                      </div>
                    </div>
                  </td>

                  {/* Reason */}
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm text-brand-black line-clamp-2">
                        {request.reason || "No reason provided"}
                      </div>
                    </div>
                  </td>

                  {/* Manager */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-brand-black">
                      {request.manager_name || "Not Assigned"}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(request.status)}>
                      {request.status || "Pending"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {request.status === "Pending" ? (
                        <>
                          <button
                            onClick={() => handleAction(request.id, "Approved")}
                            disabled={updatingId === request.id}
                            className={getActionButtonStyle("approve")}
                          >
                            <FaCheck className="w-4 h-4" />
                            {updatingId === request.id
                              ? "Processing..."
                              : "Approve"}
                          </button>
                          <button
                            onClick={() => handleAction(request.id, "Rejected")}
                            disabled={updatingId === request.id}
                            className={getActionButtonStyle("reject")}
                          >
                            <FaTimes className="w-4 h-4" />
                            {updatingId === request.id
                              ? "Processing..."
                              : "Reject"}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            handleAction(
                              request.id,
                              request.status === "Approved"
                                ? "Rejected"
                                : "Approved"
                            )
                          }
                          disabled={updatingId === request.id}
                          className={getActionButtonStyle("change")}
                        >
                          <FaEdit className="w-4 h-4" />
                          {updatingId === request.id
                            ? "Processing..."
                            : "Change Decision"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-brand-black/70">
        Showing {leaveRequests.length} leave request
        {leaveRequests.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default HRLeaveManagement;
