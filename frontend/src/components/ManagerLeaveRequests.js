import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaArrowLeft,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaEye,
  FaClock,
  FaUser,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ManagerLeaveRequests = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    action: "approve",
    notes: "",
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "/api/manager/leave-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data.leaveRequests || []);
      } else if (response.status === 401) {
        toast.error("Please login again to continue");
        logout();
        navigate("/login");
      } else {
        toast.error("Failed to fetch leave requests");
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/manager/leave-requests/${selectedRequest.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(actionForm),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowActionModal(false);
        setSelectedRequest(null);
        setActionForm({ action: "approve", notes: "" });
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update leave request");
      }
    } catch (error) {
      console.error("Error updating leave request:", error);
      toast.error("Failed to update leave request");
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "Pending Manager Approval":
        return {
          color:
            "bg-brand-yellow/20 text-deep-space-black border border-brand-yellow/40",
          text: "Pending for Manager Approval",
          icon: <FaClock className="text-brand-yellow" />,
        };
      case "Pending HR Approval":
        return {
          color:
            "bg-neon-violet/20 text-deep-space-black border border-neon-violet/40",
          text: "Pending for HR Approval",
          icon: <FaClock className="text-neon-violet" />,
        };
      case "approved":
        return {
          color:
            "bg-lumen-green/20 text-deep-space-black border border-lumen-green/40",
          text: "Approved",
          icon: <FaCheck className="text-lumen-green" />,
        };
      case "rejected":
        return {
          color: "bg-brand-coral/20 text-white border border-brand-coral/40",
          text: "Rejected",
          icon: <FaTimes className="text-brand-coral" />,
        };
      default:
        return {
          color: "bg-iridescent-pearl text-deep-space-black border border-deep-space-black/20",
          text: status,
          icon: null,
        };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canTakeAction = (status) => {
    return status === "Pending Manager Approval";
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
                Leave Requests
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
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-deep-space-black/10 hover:shadow-md hover:border-neon-violet/30 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand-yellow/20 text-deep-space-black">
                <FaClock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-deep-space-black/70">
                  Pending Approval
                </p>
                <p className="text-2xl font-semibold text-deep-space-black">
                  {
                    leaveRequests.filter(
                      (req) => req.status === "Pending Manager Approval"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-deep-space-black/10 hover:shadow-md hover:border-neon-violet/30 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-neon-violet/20 text-deep-space-black">
                <FaClock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-deep-space-black/70">
                  Pending HR
                </p>
                <p className="text-2xl font-semibold text-deep-space-black">
                  {
                    leaveRequests.filter(
                      (req) => req.status === "Pending HR Approval"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-deep-space-black/10 hover:shadow-md hover:border-neon-violet/30 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-lumen-green/20 text-deep-space-black">
                <FaCheck className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-deep-space-black/70">
                  Approved
                </p>
                <p className="text-2xl font-semibold text-deep-space-black">
                  {
                    leaveRequests.filter((req) => req.status === "approved")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-deep-space-black/10 hover:shadow-md hover:border-neon-violet/30 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand-coral/20 text-deep-space-black">
                <FaTimes className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-deep-space-black/70">
                  Rejected
                </p>
                <p className="text-2xl font-semibold text-deep-space-black">
                  {
                    leaveRequests.filter((req) => req.status === "rejected")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="bg-white rounded-xl shadow-lg border border-deep-space-black/10">
          <div className="px-6 py-4 border-b border-deep-space-black/10">
            <h2 className="text-lg font-medium text-deep-space-black">
              Leave Requests
            </h2>
            <p className="text-sm text-deep-space-black/70">
              Review and manage leave requests from your team
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-deep-space-black/10">
              <thead className="bg-iridescent-pearl">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-deep-space-black/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-deep-space-black/10">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-deep-space-black/70"
                    >
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((request) => {
                    const statusDisplay = getStatusDisplay(request.status);
                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-iridescent-pearl/50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-lumen-green/20 flex items-center justify-center">
                                <span className="text-sm font-medium text-deep-space-black">
                                  {request.first_name?.charAt(0)}
                                  {request.last_name?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-deep-space-black">
                                {request.first_name} {request.last_name}
                              </div>
                              <div className="text-sm text-deep-space-black/70">
                                {request.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                          {request.leave_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                          <div>
                            <div>{formatDate(request.from_date)}</div>
                            {request.to_date &&
                              request.to_date !== request.from_date && (
                                <div className="text-deep-space-black/70">
                                  to {formatDate(request.to_date)}
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                          {request.total_leave_days} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}
                          >
                            {statusDisplay.icon && (
                              <span className="mr-1">{statusDisplay.icon}</span>
                            )}
                            {statusDisplay.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-deep-space-black">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {canTakeAction(request.status) ? (
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowActionModal(true);
                              }}
                              className="text-neon-violet hover:text-lumen-green flex items-center space-x-1 transition-colors duration-150"
                            >
                              <FaEye />
                              <span>Review</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowActionModal(true);
                              }}
                              className="text-deep-space-black/70 hover:text-deep-space-black flex items-center space-x-1 transition-colors duration-150"
                            >
                              <FaEye />
                              <span>View</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-deep-space-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-deep-space-black/10 w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-deep-space-black">
                  {canTakeAction(selectedRequest.status)
                    ? "Review Leave Request"
                    : "Leave Request Details"}
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-deep-space-black/70 hover:text-deep-space-black transition-colors duration-200"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-iridescent-pearl/50 p-4 rounded-lg border border-deep-space-black/10">
                  <h4 className="font-medium text-deep-space-black mb-2">
                    Request Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-deep-space-black/70">Employee:</span>
                      <div className="font-medium text-deep-space-black">
                        {selectedRequest.first_name} {selectedRequest.last_name}
                      </div>
                    </div>
                    <div>
                      <span className="text-deep-space-black/70">Leave Type:</span>
                      <div className="font-medium text-deep-space-black">
                        {selectedRequest.leave_type}
                      </div>
                    </div>
                    <div>
                      <span className="text-deep-space-black/70">From Date:</span>
                      <div className="font-medium text-deep-space-black">
                        {formatDate(selectedRequest.from_date)}
                      </div>
                    </div>
                    <div>
                      <span className="text-deep-space-black/70">To Date:</span>
                      <div className="font-medium text-deep-space-black">
                        {selectedRequest.to_date
                          ? formatDate(selectedRequest.to_date)
                          : "Same day"}
                      </div>
                    </div>
                    <div>
                      <span className="text-deep-space-black/70">Total Days:</span>
                      <div className="font-medium text-deep-space-black">
                        {selectedRequest.total_leave_days} days
                      </div>
                    </div>
                    <div>
                      <span className="text-deep-space-black/70">Status:</span>
                      <div className="font-medium text-deep-space-black">
                        {getStatusDisplay(selectedRequest.status).text}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-deep-space-black/70">Reason:</span>
                    <div className="font-medium mt-1 text-deep-space-black">
                      {selectedRequest.reason}
                    </div>
                  </div>
                </div>

                {canTakeAction(selectedRequest.status) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-deep-space-black">
                        Action
                      </label>
                      <select
                        value={actionForm.action}
                        onChange={(e) =>
                          setActionForm({
                            ...actionForm,
                            action: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-deep-space-black/20 rounded-md px-3 py-2 bg-white text-deep-space-black focus:ring-lumen-green focus:border-lumen-green"
                      >
                        <option value="approve">Approve</option>
                        <option value="reject">Reject</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-deep-space-black">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={actionForm.notes}
                        onChange={(e) =>
                          setActionForm({
                            ...actionForm,
                            notes: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-deep-space-black/20 rounded-md px-3 py-2 bg-white text-deep-space-black focus:ring-lumen-green focus:border-lumen-green"
                        rows="3"
                        placeholder="Add any notes or comments..."
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="px-4 py-2 bg-white border border-deep-space-black/20 text-deep-space-black rounded-lg hover:bg-iridescent-pearl transition-colors duration-200"
                  >
                    Close
                  </button>
                  {canTakeAction(selectedRequest.status) && (
                    <button
                      onClick={handleAction}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                        actionForm.action === "approve"
                          ? "bg-lumen-green text-deep-space-black hover:bg-neon-violet"
                          : "bg-brand-coral text-white hover:bg-deep-space-black"
                      }`}
                    >
                      {actionForm.action === "approve" ? "Approve" : "Reject"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerLeaveRequests;
