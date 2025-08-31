import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const ManagerExpenseApproval = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  const fetchPendingExpenses = async () => {
    try {
      const response = await axios.get("/expenses/manager/pending");
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError("Failed to fetch pending expense requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (expenseId, action, notes = "") => {
    setProcessingId(expenseId);
    try {
      const response = await axios.put(
        `/expenses/manager/${expenseId}/approve`,
        { action, notes }
      );

      if (response.status === 200) {
        // Remove the processed expense from the list
        setExpenses(expenses.filter((expense) => expense.id !== expenseId));
        setError("");
      }
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);
      setError(
        error.response?.data?.error || `Failed to ${action} expense request`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Pending Expense Approvals
        </h2>
        <p className="text-gray-600">
          Review and approve expense requests from your team members.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No pending expense requests
          </h3>
          <p className="text-gray-500">
            All expense requests have been processed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {expenses.map((expense) => (
            <div key={expense.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {expense.expense_category} - {expense.expense_type}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Series: {expense.series}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Employee Details
                  </h4>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {expense.employee_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {expense.employee_email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Submitted:</strong> {formatDate(expense.created_at)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Expense Details
                  </h4>
                  <p className="text-sm text-gray-600">
                    <strong>Category:</strong> {expense.expense_category}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {expense.expense_type}
                  </p>
                  {expense.project_reference && (
                    <p className="text-sm text-gray-600">
                      <strong>Project:</strong> {expense.project_reference}
                    </p>
                  )}
                  {expense.payment_mode && (
                    <p className="text-sm text-gray-600">
                      <strong>Payment Mode:</strong> {expense.payment_mode}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {expense.description}
                </p>
              </div>

              {/* Attachment */}
              {expense.attachment_url && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Attachment</h4>
                  <a
                    href={`http://localhost:5001${expense.attachment_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    View {expense.attachment_name}
                  </a>
                </div>
              )}

              {/* Manager Approval Status */}
              {(expense.manager1_status ||
                expense.manager2_status ||
                expense.manager3_status) && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Manager Approval Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {expense.manager1_name && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          expense.manager1_status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : expense.manager1_status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {expense.manager1_name}:{" "}
                        {expense.manager1_status || "Pending"}
                      </span>
                    )}
                    {expense.manager2_name && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          expense.manager2_status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : expense.manager2_status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {expense.manager2_name}:{" "}
                        {expense.manager2_status || "Pending"}
                      </span>
                    )}
                    {expense.manager3_name && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          expense.manager3_status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : expense.manager3_status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {expense.manager3_name}:{" "}
                        {expense.manager3_status || "Pending"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    const notes = prompt("Add approval notes (optional):");
                    handleApproval(expense.id, "approve", notes || "");
                  }}
                  disabled={processingId === expense.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === expense.id ? "Processing..." : "Approve"}
                </button>
                <button
                  onClick={() => {
                    const notes = prompt("Add rejection notes (optional):");
                    handleApproval(expense.id, "reject", notes || "");
                  }}
                  disabled={processingId === expense.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === expense.id ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerExpenseApproval;
