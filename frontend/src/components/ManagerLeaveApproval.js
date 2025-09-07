import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { format } from "date-fns";

const ManagerLeaveApproval = () => {
  const { user, token } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    action: "",
    notes: "",
  });
  const [leaveTypes, setLeaveTypes] = useState([]);

  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/leave/types");
      setLeaveTypes(response.data);
    } catch (error) {
      console.error("Error fetching leave types:", error);
    }
  };

  const fetchPendingRequests = useCallback(async () => {
    try {
      if (!token) {
        console.error("No token available");
        return;
      }

      const response = await axios.get(
        "http://localhost:5001/api/leave/manager/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPendingRequests(response.data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      if (error.response?.status === 403) {
        setMessage("Access denied. Manager role required.");
      }
    }
  }, [token]);

  useEffect(() => {
    fetchLeaveTypes();
    if (token) {
      fetchPendingRequests();
    }
  }, [token, fetchPendingRequests]);

  const handleApproval = (request) => {
    setSelectedRequest(request);
    setApprovalData({ action: "", notes: "" });
    setShowModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!approvalData.action) {
      setMessage("Please select an action (approve or reject)");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.put(
        `http://localhost:5001/api/leave/manager/${selectedRequest.id}/approve`,
        approvalData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message);
      setShowModal(false);
      setSelectedRequest(null);

      // Refresh the list
      fetchPendingRequests();
    } catch (error) {
      console.error("Error processing approval:", error);
      setMessage(error.response?.data?.error || "Failed to process approval");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setApprovalData({ action: "", notes: "" });
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  if (user?.role !== "manager") {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-brand-pearl min-h-screen">
        <div className="bg-brand-red/10 border border-brand-red/20 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-brand-red mb-2">
            Access Denied
          </h2>
          <p className="text-brand-red/80">
            This page is only accessible to managers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-brand-pearl min-h-screen">
      <div className="bg-brand-pearl rounded-lg shadow-lg p-6 border border-brand-black/10">
        <h2 className="text-2xl font-bold text-brand-black mb-6">
          Manager Leave Approval
        </h2>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.includes("successfully")
                ? "bg-brand-green/20 text-brand-black border border-brand-green/40"
                : "bg-brand-red/20 text-brand-black border border-brand-red/40"
            }`}
          >
            {message}
          </div>
        )}

        {pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-brand-green text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-brand-black mb-2">
              No Pending Requests
            </h3>
            <p className="text-brand-black/70">
              All leave requests have been processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-black/10 bg-brand-pearl rounded-xl overflow-hidden border border-brand-black/10">
              <thead className="bg-brand-pearl border-b border-brand-black/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Series
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-brand-pearl divide-y divide-brand-black/10">
                {pendingRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-brand-pearl/80 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-black">
                      {request.series}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-brand-black">
                          {request.employee_name}
                        </div>
                        <div className="text-sm text-brand-black/70">
                          {request.employee_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                        <span className="text-sm text-brand-black">
                          {request.leave_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black">
                      {formatDate(request.from_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black">
                      {formatDate(request.to_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black">
                      {request.total_leave_days}
                      {request.half_day && " (½ day)"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-blue/20 text-brand-black border border-brand-blue/40">
                        {request.leave_balance_before} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black/70">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApproval(request)}
                        className="text-brand-green hover:text-brand-green/80 font-medium transition-colors duration-200"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-brand-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-brand-black/20 w-96 shadow-lg rounded-md bg-brand-pearl">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-brand-black mb-4">
                Review Leave Request
              </h3>

              <div className="mb-4">
                <p className="text-sm text-brand-black/70 mb-2">
                  <strong>Employee:</strong> {selectedRequest.employee_name}
                </p>
                <p className="text-sm text-brand-black/70 mb-2">
                  <div className="flex items-center">
                    {leaveTypes.find(
                      (t) => t.type_name === selectedRequest.leave_type
                    )?.color && (
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: leaveTypes.find(
                            (t) => t.type_name === selectedRequest.leave_type
                          )?.color,
                        }}
                      ></div>
                    )}
                    <span>
                      <strong>Leave Type:</strong> {selectedRequest.leave_type}
                    </span>
                  </div>
                </p>
                <p className="text-sm text-brand-black/70 mb-2">
                  <strong>From:</strong> {formatDate(selectedRequest.from_date)}
                </p>
                <p className="text-sm text-brand-black/70 mb-2">
                  <strong>To:</strong> {formatDate(selectedRequest.to_date)}
                </p>
                <p className="text-sm text-brand-black/70 mb-2">
                  <strong>Total Days:</strong>{" "}
                  {selectedRequest.total_leave_days}
                </p>
                <p className="text-sm text-brand-black/70 mb-2">
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-black mb-2">
                  Action *
                </label>
                <select
                  value={approvalData.action}
                  onChange={(e) =>
                    setApprovalData((prev) => ({
                      ...prev,
                      action: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-brand-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
                >
                  <option value="">Select Action</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-black mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) =>
                    setApprovalData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Add any notes or comments..."
                  className="w-full px-3 py-2 border border-brand-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black placeholder-brand-black/50"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-brand-black bg-brand-pearl border border-brand-black/20 rounded-md hover:bg-brand-pearl/80 focus:outline-none focus:ring-2 focus:ring-brand-black/20 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalSubmit}
                  disabled={loading || !approvalData.action}
                  className="px-4 py-2 text-sm font-medium text-brand-black bg-brand-green rounded-md hover:bg-hover-primary focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50 transition-colors duration-200"
                >
                  {loading ? "Processing..." : "Submit Decision"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerLeaveApproval;
