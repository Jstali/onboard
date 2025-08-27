import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaEye, FaEdit, FaTrash, FaDownload, FaSearch } from "react-icons/fa";

const EmployeeFormManagement = ({ onRefresh }) => {
  const [employeeForms, setEmployeeForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormDetails, setShowFormDetails] = useState(false);

  useEffect(() => {
    fetchEmployeeForms();
  }, []);

  const fetchEmployeeForms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5001/api/hr/employee-forms"
      );
      setEmployeeForms(response.data.forms);
    } catch (error) {
      console.error("Error fetching employee forms:", error);
      toast.error("Failed to fetch employee forms");
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = (form) => {
    setSelectedForm(form);
    setShowFormDetails(true);
  };

  const handleDeleteForm = async (formId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this form? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(
          `http://localhost:5001/api/hr/employee-forms/${formId}`
        );
        toast.success("Form deleted successfully!");
        fetchEmployeeForms();
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Delete form error:", error);
        toast.error("Failed to delete form");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Pending
          </span>
        );
      case "submitted":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Submitted
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "Full-Time":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            Full-Time
          </span>
        );
      case "Contract":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
            Contract
          </span>
        );
      case "Intern":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
            Intern
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {type || "Unknown"}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredForms = employeeForms.filter((form) => {
    const matchesSearch =
      form.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.form_data?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.form_data?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || form.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Employee Form Management
        </h2>
        <p className="text-gray-600">
          View and manage all employee onboarding forms submitted by candidates.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Forms Table */}
      {filteredForms.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Employee Forms Found
          </h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "No employee forms have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredForms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {form.user_email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {form.first_name && form.last_name
                          ? `${form.first_name} ${form.last_name}`
                          : form.form_data?.name || "Name not available"}
                      </div>
                      {form.phone && (
                        <div className="text-xs text-gray-400">
                          📞 {form.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(form.employee_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(form.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {form.assigned_manager ? (
                      <span className="text-sm text-green-600 font-medium">
                        {form.assigned_manager}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Not assigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(form.submitted_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewForm(form)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View Form Details"
                    >
                      <FaEye className="inline-block" />
                    </button>
                    <button
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Form"
                    >
                      <FaTrash className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Details Modal */}
      {showFormDetails && selectedForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Employee Form Details
              </h3>
              <button
                onClick={() => setShowFormDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Email
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedForm.user_email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedForm.employee_type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div>{getStatusBadge(selectedForm.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submitted Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedForm.submitted_at)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedForm.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Manager
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedForm.assigned_manager || "Not assigned"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedForm.department || "Not assigned"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedForm.designation || "Not assigned"}
                  </p>
                </div>
              </div>

              {/* Emergency Contact Information */}
              {(selectedForm.emergency_contact_name ||
                selectedForm.emergency_contact_phone) && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Emergency Contact
                  </h4>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedForm.emergency_contact_name && (
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">
                            Contact Name
                          </label>
                          <p className="text-sm text-red-900">
                            {selectedForm.emergency_contact_name}
                          </p>
                        </div>
                      )}
                      {selectedForm.emergency_contact_phone && (
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">
                            Contact Phone
                          </label>
                          <p className="text-sm text-red-900">
                            {selectedForm.emergency_contact_phone}
                          </p>
                        </div>
                      )}
                      {selectedForm.emergency_contact_relationship && (
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">
                            Relationship
                          </label>
                          <p className="text-sm text-red-900">
                            {selectedForm.emergency_contact_relationship}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Data */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Form Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedForm.form_data || {}).map(
                      ([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                            {key.replace(/_/g, " ")}
                          </label>
                          <p className="text-sm text-gray-900">
                            {typeof value === "string"
                              ? value
                              : JSON.stringify(value)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Files */}
              {selectedForm.files && selectedForm.files.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Attached Files
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {selectedForm.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-700">{file}</span>
                          <button className="text-blue-600 hover:text-blue-800">
                            <FaDownload className="inline-block mr-1" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowFormDetails(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeFormManagement;
