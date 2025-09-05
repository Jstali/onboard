import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const EmployeeExpenseHistory = ({ onNavigateToSubmit }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get("/expenses/my-requests");
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError("Failed to fetch expense requests");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending_manager_approval":
        return "bg-yellow-100 text-yellow-800";
      case "manager_approved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "pending_manager_approval":
        return "Pending Manager Approval";
      case "manager_approved":
        return "Manager Approved - Pending HR";
      default:
        return status;
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onNavigateToSubmit) {
              onNavigateToSubmit();
            } else {
              window.history.back();
            }
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer select-none"
          type="button"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          My Expense Requests
        </h2>
        <p className="text-gray-600">
          View the status of all your submitted expense requests.
        </p>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No expense requests found
          </h3>
          <p className="text-gray-500">
            You haven't submitted any expense requests yet.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <li key={expense.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {expense.expense_category} - {expense.expense_type}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Series: {expense.series}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            expense.status
                          )}`}
                        >
                          {getStatusText(expense.status)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(expense.expense_date)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {expense.description}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Submitted:
                        </span>{" "}
                        {formatDate(expense.created_at)}
                      </div>
                      {expense.all_managers && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Managers:
                          </span>{" "}
                          {expense.all_managers}
                        </div>
                      )}
                      {expense.project_reference && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Project:
                          </span>{" "}
                          {expense.project_reference}
                        </div>
                      )}
                      {expense.payment_mode && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Payment Mode:
                          </span>{" "}
                          {expense.payment_mode}
                        </div>
                      )}
                    </div>

                    {/* Manager Approval Status */}
                    {(expense.manager1_status ||
                      expense.manager2_status ||
                      expense.manager3_status) && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Manager Approval Status:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {expense.manager1_name && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {expense.manager1_name}:{" "}
                              {expense.manager1_status || "Pending"}
                            </span>
                          )}
                          {expense.manager2_name && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {expense.manager2_name}:{" "}
                              {expense.manager2_status || "Pending"}
                            </span>
                          )}
                          {expense.manager3_name && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {expense.manager3_name}:{" "}
                              {expense.manager3_status || "Pending"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* HR Approval */}
                    {expense.hr_name && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          HR Approval:
                        </h4>
                        <p className="text-sm text-gray-600">
                          {expense.hr_name} -{" "}
                          {formatDate(expense.hr_approved_at)}
                        </p>
                        {expense.hr_approval_notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Notes:</span>{" "}
                            {expense.hr_approval_notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Attachment */}
                    {expense.attachment_url && (
                      <div className="mt-3">
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
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmployeeExpenseHistory;
