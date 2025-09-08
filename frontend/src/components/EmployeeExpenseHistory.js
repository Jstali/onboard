import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const EmployeeExpenseHistory = ({ onNavigateToSubmit }) => {
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
        return "bg-brand-green/20 text-brand-black border border-brand-green/40";
      case "rejected":
        return "bg-brand-red/20 text-brand-black border border-brand-red/40";
      case "Pending Manager Approval":
        return "bg-brand-yellow/20 text-brand-black border border-brand-yellow/40";
      case "manager Approved":
        return "bg-brand-blue/20 text-brand-black border border-brand-blue/40";
      default:
        return "bg-brand-pearl text-brand-black/70 border border-brand-black/20";
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "Pending Manager Approval":
        return "Pending for Manager Approval";
      case "manager Approved":
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
      <div className="flex justify-center items-center h-64 bg-brand-pearl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-brand-pearl">
        <div className="bg-brand-red/20 border border-brand-red/40 text-brand-black px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-brand-pearl min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-black mb-2">
          My Expense Requests
        </h2>
        <p className="text-brand-black/70">
          View the status of all your submitted expense requests.
        </p>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-brand-green text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-brand-black mb-2">
            No expense requests found
          </h3>
          <p className="text-brand-black/70">
            You haven't submitted any expense requests yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-brand-pearl rounded-lg shadow-lg border border-brand-black/10 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-brand-black mb-1">
                    {expense.expense_category} - {expense.expense_type}
                  </h3>
                  <p className="text-sm text-brand-black/70">
                    Series: {expense.series}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    expense.status
                  )}`}
                >
                  {getStatusText(expense.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="bg-brand-pearl/50 rounded-lg p-3 border border-brand-black/10">
                  <div className="text-sm font-medium text-brand-black/70 mb-1">
                    Amount
                  </div>
                  <div className="text-lg font-semibold text-brand-black">
                    {formatCurrency(expense.amount, expense.currency)}
                  </div>
                </div>
                <div className="bg-brand-pearl/50 rounded-lg p-3 border border-brand-black/10">
                  <div className="text-sm font-medium text-brand-black/70 mb-1">
                    Expense Date
                  </div>
                  <div className="text-sm text-brand-black">
                    {formatDate(expense.expense_date)}
                  </div>
                </div>
                <div className="bg-brand-pearl/50 rounded-lg p-3 border border-brand-black/10">
                  <div className="text-sm font-medium text-brand-black/70 mb-1">
                    Submitted
                  </div>
                  <div className="text-sm text-brand-black">
                    {formatDate(expense.created_at)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-brand-black/70 mb-2">
                  Description
                </div>
                <div className="text-sm text-brand-black bg-brand-pearl/50 rounded-lg p-3 border border-brand-black/10">
                  {expense.description}
                </div>
              </div>

              {/* Additional Details */}
              {(expense.all_managers ||
                expense.project_reference ||
                expense.payment_mode) && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-brand-black/70 mb-2">
                    Additional Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {expense.all_managers && (
                      <div className="bg-brand-pearl/50 rounded-lg p-3 border border-brand-black/10">
                        <div className="text-sm font-medium text-brand-black/70 mb-1">
                          Managers
                        </div>
                        <div className="text-sm text-brand-black">
                          {expense.all_managers}
                        </div>
                      </div>
                    )}
                    {expense.project_reference && (
                      <div className="bg-brand-pearl/50 rounded-lg p-3 border border-brand-black/10">
                        <div className="text-sm font-medium text-brand-black/70 mb-1">
                          Project
                        </div>
                        <div className="text-sm text-brand-black">
                          {expense.project_reference}
                        </div>
                      </div>
                    )}
                    {expense.payment_mode && (
                      <div className="bg-brand-pearl/50 rounded-lg p-3 border border-brand-black/10">
                        <div className="text-sm font-medium text-brand-black/70 mb-1">
                          Payment Mode
                        </div>
                        <div className="text-sm text-brand-black">
                          {expense.payment_mode}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manager Approval Status */}
              {(expense.manager1_status ||
                expense.manager2_status ||
                expense.manager3_status) && (
                <div className="border-t border-brand-black/10 pt-4 mb-4">
                  <div className="text-sm font-medium text-brand-black/70 mb-3">
                    Manager Approval Status
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {expense.manager1_name && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-pearl/50 text-brand-black border border-brand-black/20">
                        {expense.manager1_name}:{" "}
                        {expense.manager1_status || "Pending"}
                      </span>
                    )}
                    {expense.manager2_name && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-pearl/50 text-brand-black border border-brand-black/20">
                        {expense.manager2_name}:{" "}
                        {expense.manager2_status || "Pending"}
                      </span>
                    )}
                    {expense.manager3_name && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-pearl/50 text-brand-black border border-brand-black/20">
                        {expense.manager3_name}:{" "}
                        {expense.manager3_status || "Pending"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* HR Approval */}
              {expense.hr_name && (
                <div className="border-t border-brand-black/10 pt-4 mb-4">
                  <div className="text-sm font-medium text-brand-black/70 mb-2">
                    HR Approval
                  </div>
                  <div className="bg-brand-pearl/50 rounded-lg p-3 border border-brand-black/10">
                    <div className="text-sm text-brand-black mb-1">
                      {expense.hr_name} - {formatDate(expense.hrApprovedAt)}
                    </div>
                    {expense.hrApprovalNotes && (
                      <div className="text-sm text-brand-black/70">
                        <span className="font-medium">Notes:</span>{" "}
                        {expense.hrApprovalNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachment */}
              {expense.attachment_url && (
                <div className="border-t border-brand-black/10 pt-4">
                  <div className="text-sm font-medium text-brand-black/70 mb-2">
                    Attachment
                  </div>
                  <a
                    href={`http://localhost:2026${expense.attachment_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-brand-green hover:text-brand-green/80 bg-brand-green/10 rounded-lg px-3 py-2 transition-colors duration-200"
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
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeExpenseHistory;
