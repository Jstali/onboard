import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEye } from "react-icons/fa";

const HRExpenseManagement = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [activeTab]);

  const fetchExpenses = async () => {
    try {
      const endpoint =
        activeTab === "pending" ? "/expenses/hr/pending" : "/expenses/all";
      const response = await axios.get(endpoint);
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError("Failed to fetch expense requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (expenseId, action, notes = "") => {
    setProcessingId(expenseId);
    try {
      const response = await axios.put(
        `/expenses/hr/${expenseId}/approve`,
        {
          action,
          notes,
        },
        {
          timeout: 20000, // 20 second timeout for expense approval
        }
      );

      if (response.status === 200) {
        // Show success message
        const actionText = action === "approve" ? "approved" : "rejected";
        toast.success(`Expense request ${actionText} successfully!`, {
          duration: 4000,
          position: "top-right",
        });

        // Remove the processed expense from pending list
        if (activeTab === "pending") {
          setExpenses(expenses.filter((expense) => expense.id !== expenseId));
        } else {
          // Refresh all expenses
          fetchExpenses();
        }
        setError("");
      }
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);

      let errorMessage = `Failed to ${action} expense request`;

      if (error.code === "ECONNABORTED") {
        errorMessage = `Request timed out. Please try again. The ${action} operation may still have been processed.`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  const handleDelete = async (expenseId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this expense request? This action cannot be undone."
      )
    ) {
      return;
    }

    setProcessingId(expenseId);
    try {
      const response = await axios.delete(`/expenses/${expenseId}`);

      if (response.status === 200) {
        toast.success("Expense request deleted successfully!", {
          duration: 4000,
          position: "top-right",
        });

        // Remove the deleted expense from the list
        setExpenses(expenses.filter((expense) => expense.id !== expenseId));
        setError("");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete expense request";
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-brand-pearl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-brand-pearl min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-black mb-2">
          Expense Management
        </h2>
        <p className="text-brand-black/70">
          Review and manage all expense requests in the system.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-brand-black/10">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === "pending"
                  ? "border-brand-green text-brand-green"
                  : "border-transparent text-brand-black/70 hover:text-brand-black hover:border-brand-black/30"
              }`}
            >
              Pending HR Approval
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === "all"
                  ? "border-brand-green text-brand-green"
                  : "border-transparent text-brand-black/70 hover:text-brand-black hover:border-brand-black/30"
              }`}
            >
              All Expenses
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-brand-red/20 border border-brand-red/40 text-brand-black rounded">
          {error}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-brand-green text-6xl mb-4">
            {activeTab === "pending" ? "✅" : "📄"}
          </div>
          <h3 className="text-lg font-medium text-brand-black mb-2">
            {activeTab === "pending"
              ? "No pending expense requests"
              : "No expense requests found"}
          </h3>
          <p className="text-brand-black/70">
            {activeTab === "pending"
              ? "All expense requests have been processed."
              : "No expense requests have been submitted yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Pending HR Approval - Card View */}
          {activeTab === "pending" && (
            <div className="space-y-6">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-brand-pearl shadow rounded-lg p-6 border border-brand-black/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-brand-black">
                        {expense.expense_category} - {expense.expense_type}
                      </h3>
                      <p className="text-sm text-brand-black/70">
                        Series: {expense.series}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-brand-black">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                      <p className="text-sm text-brand-black/70">
                        {formatDate(expense.expense_date)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          expense.status
                        )}`}
                      >
                        {getStatusText(expense.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-brand-black mb-2">
                        Employee Details
                      </h4>
                      <p className="text-sm text-brand-black/70">
                        <strong>Name:</strong> {expense.employee_name}
                      </p>
                      <p className="text-sm text-brand-black/70">
                        <strong>Email:</strong> {expense.employee_email}
                      </p>
                      <p className="text-sm text-brand-black/70">
                        <strong>Submitted:</strong>{" "}
                        {formatDate(expense.created_at)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-brand-black mb-2">
                        Expense Details
                      </h4>
                      <p className="text-sm text-brand-black/70">
                        <strong>Category:</strong> {expense.expense_category}
                      </p>
                      <p className="text-sm text-brand-black/70">
                        <strong>Type:</strong> {expense.expense_type}
                      </p>
                      {expense.project_reference && (
                        <p className="text-sm text-brand-black/70">
                          <strong>Project:</strong> {expense.project_reference}
                        </p>
                      )}
                      {expense.payment_mode && (
                        <p className="text-sm text-brand-black/70">
                          <strong>Payment Mode:</strong> {expense.payment_mode}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-brand-black mb-2">
                      Description
                    </h4>
                    <p className="text-sm text-brand-black/70 bg-brand-pearl/50 p-3 rounded border border-brand-black/10">
                      {expense.description}
                    </p>
                  </div>

                  {/* Manager Approval Status */}
                  {expense.manager_approval_status && (
                    <div className="mb-4">
                      <h4 className="font-medium text-brand-black mb-2">
                        Manager Approval Status
                      </h4>
                      <p className="text-sm text-brand-black/70 bg-brand-blue/10 p-3 rounded border border-brand-blue/20">
                        {expense.manager_approval_status}
                      </p>
                    </div>
                  )}

                  {/* HR Approval */}
                  {expense.hr_name && (
                    <div className="mb-4">
                      <h4 className="font-medium text-brand-black mb-2">
                        HR Approval
                      </h4>
                      <p className="text-sm text-brand-black/70">
                        <strong>Approved by:</strong> {expense.hr_name} on{" "}
                        {formatDate(expense.hrApprovedAt)}
                      </p>
                      {expense.hrApprovalNotes && (
                        <p className="text-sm text-brand-black/70 mt-1">
                          <strong>Notes:</strong> {expense.hrApprovalNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Attachment */}
                  {expense.attachment_url && (
                    <div className="mb-4">
                      <h4 className="font-medium text-brand-black mb-2">
                        Attachment
                      </h4>
                      <a
                        href={`http://localhost:2026${expense.attachment_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-brand-green hover:text-brand-green/80 transition-colors duration-200"
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

                  {/* Approval Actions - Only show for pending requests */}
                  {activeTab === "pending" &&
                    expense.status === "Manager Approved" && (
                      <div className="flex justify-end space-x-3 pt-4 border-t border-brand-black/10">
                        <button
                          onClick={() => {
                            const notes = prompt(
                              "Add approval notes (optional):"
                            );
                            handleApproval(expense.id, "approve", notes || "");
                          }}
                          disabled={processingId === expense.id}
                          className="px-4 py-2 bg-brand-green text-brand-black rounded-md hover:bg-hover-primary focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200"
                        >
                          {processingId === expense.id && (
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-black"
                              xmlns="http://www.w3.org/2000/svg"
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
                          )}
                          {processingId === expense.id
                            ? "Processing..."
                            : "Approve"}
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt(
                              "Add rejection notes (optional):"
                            );
                            handleApproval(expense.id, "reject", notes || "");
                          }}
                          disabled={processingId === expense.id}
                          className="px-4 py-2 bg-brand-red text-brand-black rounded-md hover:bg-hover-danger focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200"
                        >
                          {processingId === expense.id && (
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-black"
                              xmlns="http://www.w3.org/2000/svg"
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
                          )}
                          {processingId === expense.id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}

          {/* All Expenses - Table View */}
          {activeTab === "all" && (
            <div className="bg-brand-pearl shadow overflow-hidden sm:rounded-md border border-brand-black/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-black/10">
                  <thead className="bg-brand-pearl border-b border-brand-black/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                        Expense Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-brand-pearl divide-y divide-brand-black/10">
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-brand-pearl/80 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-brand-black">
                              {expense.employee_name}
                            </div>
                            <div className="text-sm text-brand-black/70">
                              {expense.employee_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-brand-black">
                              {expense.expense_category} -{" "}
                              {expense.expense_type}
                            </div>
                            <div className="text-sm text-brand-black/70">
                              Series: {expense.series}
                            </div>
                            {expense.project_reference && (
                              <div className="text-sm text-brand-black/70">
                                Project: {expense.project_reference}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-brand-black">
                            {formatCurrency(expense.amount, expense.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-brand-black">
                            {formatDate(expense.expense_date)}
                          </div>
                          <div className="text-sm text-brand-black/70">
                            Submitted: {formatDate(expense.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              expense.status
                            )}`}
                          >
                            {getStatusText(expense.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(expense)}
                            className="text-brand-green hover:text-brand-green/80 p-1 rounded transition-colors duration-200"
                            title="View Details"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Expense Details Modal */}
      {showDetailsModal && selectedExpense && (
        <div className="fixed inset-0 bg-brand-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-brand-black/20 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-brand-pearl">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-brand-black">
                  Expense Details - {selectedExpense.expense_category} -{" "}
                  {selectedExpense.expense_type}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-brand-black/60 hover:text-brand-black transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-brand-black mb-3">
                    Employee Details
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-brand-black/70">
                      <strong>Name:</strong> {selectedExpense.employee_name}
                    </p>
                    <p className="text-sm text-brand-black/70">
                      <strong>Email:</strong> {selectedExpense.employee_email}
                    </p>
                    <p className="text-sm text-brand-black/70">
                      <strong>Submitted:</strong>{" "}
                      {formatDate(selectedExpense.created_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-brand-black mb-3">
                    Expense Details
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-brand-black/70">
                      <strong>Category:</strong>{" "}
                      {selectedExpense.expense_category}
                    </p>
                    <p className="text-sm text-brand-black/70">
                      <strong>Type:</strong> {selectedExpense.expense_type}
                    </p>
                    <p className="text-sm text-brand-black/70">
                      <strong>Amount:</strong>{" "}
                      {formatCurrency(
                        selectedExpense.amount,
                        selectedExpense.currency
                      )}
                    </p>
                    <p className="text-sm text-brand-black/70">
                      <strong>Date:</strong>{" "}
                      {formatDate(selectedExpense.expense_date)}
                    </p>
                    {selectedExpense.project_reference && (
                      <p className="text-sm text-brand-black/70">
                        <strong>Project:</strong>{" "}
                        {selectedExpense.project_reference}
                      </p>
                    )}
                    {selectedExpense.payment_mode && (
                      <p className="text-sm text-brand-black/70">
                        <strong>Payment Mode:</strong>{" "}
                        {selectedExpense.payment_mode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-brand-black mb-3">
                  Description
                </h4>
                <p className="text-sm text-brand-black/70 bg-brand-pearl/50 p-3 rounded border border-brand-black/10">
                  {selectedExpense.description}
                </p>
              </div>

              {selectedExpense.manager_approval_status && (
                <div className="mt-6">
                  <h4 className="font-medium text-brand-black mb-3">
                    Manager Approval Status
                  </h4>
                  <p className="text-sm text-brand-black/70 bg-brand-blue/10 p-3 rounded border border-brand-blue/20">
                    {selectedExpense.manager_approval_status}
                  </p>
                </div>
              )}

              {selectedExpense.hr_name && (
                <div className="mt-6">
                  <h4 className="font-medium text-brand-black mb-3">
                    HR Approval
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-brand-black/70">
                      <strong>Approved by:</strong> {selectedExpense.hr_name}
                    </p>
                    <p className="text-sm text-brand-black/70">
                      <strong>Approved on:</strong>{" "}
                      {formatDate(selectedExpense.hrApprovedAt)}
                    </p>
                    {selectedExpense.hrApprovalNotes && (
                      <p className="text-sm text-brand-black/70">
                        <strong>Notes:</strong>{" "}
                        {selectedExpense.hrApprovalNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedExpense.attachment_url && (
                <div className="mt-6">
                  <h4 className="font-medium text-brand-black mb-3">
                    Attachment
                  </h4>
                  <a
                    href={`http://localhost:2026${selectedExpense.attachment_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-brand-green hover:text-brand-green/80 transition-colors duration-200"
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
                    View {selectedExpense.attachment_name}
                  </a>
                </div>
              )}

              {/* Approval Actions - Only show for pending requests */}
              {activeTab === "pending" &&
                selectedExpense.status === "Manager Approved" && (
                  <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-brand-black/10">
                    <button
                      onClick={() => {
                        const notes = prompt("Add approval notes (optional):");
                        handleApproval(
                          selectedExpense.id,
                          "approve",
                          notes || ""
                        );
                        setShowDetailsModal(false);
                      }}
                      disabled={processingId === selectedExpense.id}
                      className="px-4 py-2 bg-brand-green text-brand-black rounded-md hover:bg-hover-primary focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200"
                    >
                      {processingId === selectedExpense.id && (
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-black"
                          xmlns="http://www.w3.org/2000/svg"
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
                      )}
                      {processingId === selectedExpense.id
                        ? "Processing..."
                        : "Approve"}
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt("Add rejection notes (optional):");
                        handleApproval(
                          selectedExpense.id,
                          "reject",
                          notes || ""
                        );
                        setShowDetailsModal(false);
                      }}
                      disabled={processingId === selectedExpense.id}
                      className="px-4 py-2 bg-brand-red text-brand-black rounded-md hover:bg-hover-danger focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200"
                    >
                      {processingId === selectedExpense.id && (
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-black"
                          xmlns="http://www.w3.org/2000/svg"
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
                      )}
                      {processingId === selectedExpense.id
                        ? "Processing..."
                        : "Reject"}
                    </button>
                  </div>
                )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-brand-pearl border border-brand-black/20 text-brand-black rounded-md hover:bg-brand-pearl/80 focus:outline-none focus:ring-2 focus:ring-brand-black/20 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRExpenseManagement;
