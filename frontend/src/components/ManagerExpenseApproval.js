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
      <div className="flex justify-center items-center h-64 bg-brand-pearl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-pearl flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-brand-pearl rounded-xl shadow-lg border border-brand-black/10 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-brand-green/10 to-brand-violet/10 px-8 py-6 border-b border-brand-black/10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-brand-black mb-2">
                Pending Expense Approvals
              </h2>
              <p className="text-brand-black/70">
                Review and approve expense requests from your team members.
              </p>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-brand-red/20 border border-brand-red/40 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-brand-red mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-brand-black font-medium">{error}</span>
                </div>
              </div>
            )}

            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-brand-green"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-brand-black mb-2">
                  No pending expense requests
                </h3>
                <p className="text-brand-black/70">
                  All expense requests have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-brand-pearl/50 rounded-lg p-6 border border-brand-black/10"
                  >
                    {/* Expense Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-brand-black mb-1">
                          {expense.expense_category} - {expense.expense_type}
                        </h3>
                        <p className="text-sm text-brand-black/70">
                          Series: {expense.series} • Submitted:{" "}
                          {formatDate(expense.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-brand-green">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                        <p className="text-sm text-brand-black/70">
                          {formatDate(expense.expense_date)}
                        </p>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="bg-brand-pearl rounded-lg p-6 mb-6 border border-brand-black/10">
                      <h4 className="font-semibold text-brand-black mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 text-brand-green mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Request Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-brand-black/10">
                          <span className="text-brand-black/70 font-medium">
                            Employee
                          </span>
                          <span className="font-semibold text-brand-black">
                            {expense.employee_name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-brand-black/10">
                          <span className="text-brand-black/70 font-medium">
                            Category
                          </span>
                          <span className="font-semibold text-brand-black">
                            {expense.expense_category}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-brand-black/10">
                          <span className="text-brand-black/70 font-medium">
                            Amount
                          </span>
                          <span className="font-bold text-brand-green text-lg">
                            {formatCurrency(expense.amount, expense.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-brand-black/70 font-medium">
                            Manager
                          </span>
                          <span className="font-semibold text-brand-black">
                            {user?.name || "Current User"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {expense.description && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-brand-black mb-3">
                          Description
                        </h4>
                        <div className="bg-brand-pearl rounded-lg p-4 border border-brand-black/10">
                          <p className="text-brand-black/70">
                            {expense.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Attachment */}
                    {expense.attachment_url && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-brand-black mb-3">
                          Attachment
                        </h4>
                        <a
                          href={`http://localhost:2026${expense.attachment_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-brand-green/10 text-brand-green rounded-lg border border-brand-green/20 hover:bg-brand-green/20 transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
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

                    {/* Approval Actions */}
                    <div className="flex justify-end space-x-4 pt-4 border-t border-brand-black/10">
                      <button
                        onClick={() => {
                          const notes = prompt(
                            "Add approval notes (optional):"
                          );
                          handleApproval(expense.id, "approve", notes || "");
                        }}
                        disabled={processingId === expense.id}
                        className="px-6 py-3 bg-brand-green text-brand-black rounded-lg hover:bg-hover-primary focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                      >
                        {processingId === expense.id ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-black"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Approve
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt(
                            "Add rejection notes (optional):"
                          );
                          handleApproval(expense.id, "reject", notes || "");
                        }}
                        disabled={processingId === expense.id}
                        className="px-6 py-3 bg-brand-red text-brand-black rounded-lg hover:bg-hover-danger focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                      >
                        {processingId === expense.id ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-black"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerExpenseApproval;
