import React, { useState } from "react";
import { FaEye, FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const EmployeeList = ({ employees, onRefresh, onApprove }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: "approved",
    managerId: "",
    employeeId: "",
    companyEmail: "",
    userId: "",
  });

  const handleViewDetails = async (employeeId) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/hr/employees/${employeeId}/form`
      );
      setSelectedEmployee(response.data.form);
    } catch (error) {
      toast.error("Failed to fetch employee details");
    }
  };

  const handleApprove = (employee) => {
    console.log("✅ Approving employee:", employee);
    setApprovalData({
      status: "approved",
      userId: employee.id, // Store the actual user ID for the API call
    });
    setShowApprovalModal(true);
  };

  const handleReject = (employee) => {
    console.log("❌ Rejecting employee:", employee);
    setApprovalData({
      status: "rejected",
      userId: employee.id, // Store the actual user ID for the API call
    });
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    try {
      // Use the stored user ID directly
      if (!approvalData.userId) {
        toast.error("Employee ID not found");
        return;
      }

      console.log("🎯 Submitting approval:", {
        userId: approvalData.userId,
        status: approvalData.status,
        data: approvalData,
      });

      await axios.put(
        `http://localhost:5001/api/hr/employees/${approvalData.userId}/approve`,
        approvalData
      );
      toast.success(`Employee ${approvalData.status} successfully!`);
      setShowApprovalModal(false);
      setSelectedEmployee(null);
      onApprove();
    } catch (error) {
      console.error("Approval error:", error);
      if (error.response) {
        console.log("Response status:", error.response.status);
        console.log("Response data:", error.response.data);
      }
      toast.error(
        error.response?.data?.error || "Failed to update employee status"
      );
    }
  };

  const handleDelete = async (employeeId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this employee? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(
          `http://localhost:5001/api/hr/employees/${employeeId}`
        );
        toast.success("Employee deleted successfully!");
        onRefresh();
      } catch (error) {
        toast.error("Failed to delete employee");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "submitted":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-brand-yellow/20 text-brand-black rounded-full">
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-brand-green text-brand-black rounded-full">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-brand-red/20 text-brand-red rounded-full">
            Rejected
          </span>
        );
      case "no_form":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-brand-black/10 text-brand-black/60 rounded-full">
            No Form
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium bg-brand-black/10 text-brand-black/60 rounded-full">
            {status || "Unknown"}
          </span>
        );
    }
  };

  return (
    <div className="bg-brand-pearl rounded-lg shadow-md border border-brand-black/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-black/10">
          <thead className="bg-brand-pearl">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-brand-pearl divide-y divide-brand-black/10">
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="hover:bg-ui-secondary transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-brand-black">
                      {employee.email}
                    </div>
                    <div className="text-sm text-brand-black/60">
                      ID: {employee.id}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-brand-black">
                    {employee.type || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(employee.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black/60">
                  {employee.submitted_at
                    ? new Date(employee.submitted_at).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewDetails(employee.id)}
                      className="text-brand-green hover:text-state-hover p-1 transition-colors rounded"
                      title="View Details"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                    {employee.status === "submitted" && (
                      <>
                        <button
                          onClick={() => handleApprove(employee)}
                          className="text-brand-green hover:text-state-hover p-1 transition-colors rounded"
                          title="Approve"
                        >
                          <FaCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(employee)}
                          className="text-brand-yellow hover:text-brand-yellow/80 p-1 transition-colors rounded"
                          title="Reject"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {employee.status === "no_form" && (
                      <span className="text-xs text-brand-black/40 italic">
                        No form to approve
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-brand-red hover:text-hover-danger p-1 transition-colors rounded"
                      title="Delete"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-brand-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border border-brand-black/10 w-3/4 shadow-lg rounded-lg bg-brand-pearl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-brand-black">
                Employee Details
              </h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-brand-black/60 hover:text-brand-black transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-black">
                    Employment Type
                  </label>
                  <p className="text-sm text-brand-black">
                    {selectedEmployee.type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-black">
                    Status
                  </label>
                  <p className="text-sm text-brand-black">
                    {selectedEmployee.status}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-black">
                  Form Data
                </label>
                <pre className="bg-ui-secondary p-4 rounded-lg text-sm overflow-auto max-h-64 text-brand-black border border-brand-black/10">
                  {JSON.stringify(selectedEmployee.form_data, null, 2)}
                </pre>
              </div>

              {selectedEmployee.files && selectedEmployee.files.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-brand-black">
                    Files
                  </label>
                  <ul className="text-sm text-brand-black">
                    {selectedEmployee.files.map((file, index) => (
                      <li key={index}>{file}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-brand-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border border-brand-black/10 w-96 shadow-lg rounded-lg bg-brand-pearl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-brand-black">
                {approvalData.status === "approved" ? "Approve" : "Reject"}{" "}
                Employee
              </h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-brand-black/60 hover:text-brand-black transition-colors"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApprovalSubmit();
              }}
              className="space-y-4"
            >
              {approvalData.status === "approved" && (
                <div className="bg-brand-green/10 border border-brand-green/20 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-brand-green"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-brand-black">
                        Approval Note
                      </h3>
                      <div className="mt-2 text-sm text-brand-black/70">
                        <p>
                          Employee will be moved to the "Onboarded Employees"
                          tab where you can assign their name, company email,
                          and other details.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-sm font-medium text-brand-black bg-brand-violet border border-brand-black/20 rounded-lg hover:bg-hover-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-violet shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-brand-black border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md transition-colors ${
                    approvalData.status === "approved"
                      ? "bg-brand-green hover:bg-hover-primary focus:ring-brand-green"
                      : "bg-brand-red hover:bg-hover-danger focus:ring-brand-red"
                  }`}
                >
                  {approvalData.status === "approved" ? "Approve" : "Reject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
