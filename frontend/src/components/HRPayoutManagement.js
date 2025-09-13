import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaSearch,
  FaEdit,
  FaEye,
  FaDownload,
  FaSpinner,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

const HRPayoutManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDraft, setFilterDraft] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, filterDraft]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        isDraft: filterDraft === "all" ? "" : filterDraft,
      });

      const response = await axios.get(`/adp-payroll/all?${params}`);
      if (response.data.success) {
        setEmployees(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEmployees();
  };

  const handleViewEmployee = async (employeeId) => {
    try {
      const response = await axios.get(`/adp-payroll/merged/${employeeId}`);
      if (response.data.success) {
        setSelectedEmployee(response.data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast.error("Failed to fetch employee details");
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`/adp-payroll/all?export=true`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `adp_payroll_export_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const getStatusBadge = (isDraft) => {
    if (isDraft) {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
          Draft
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
        Finalized
      </span>
    );
  };

  const renderEmployeeModal = () => {
    if (!selectedEmployee) return null;

    const { onboarding, adp_payroll, has_adp_data, adp_is_draft } =
      selectedEmployee;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                Employee Payroll Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Onboarding Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-800 border-b pb-2">
                  Onboarding Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Employee ID:</span>
                    <span>{onboarding.employee_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{onboarding.employee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{onboarding.company_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Department:</span>
                    <span>{onboarding.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Designation:</span>
                    <span>{onboarding.designation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{onboarding.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        onboarding.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {onboarding.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">DOJ:</span>
                    <span>{onboarding.doj}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Manager:</span>
                    <span>{onboarding.manager_name || "Not assigned"}</span>
                  </div>
                </div>
              </div>

              {/* ADP Payroll Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-800 border-b pb-2">
                    ADP Payroll Information
                  </h4>
                  {has_adp_data && getStatusBadge(adp_is_draft)}
                </div>

                {has_adp_data ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(adp_payroll).map(([key, value]) => {
                      if (value === null || value === undefined || value === "")
                        return null;
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-600">
                            {key}:
                          </span>
                          <span className="text-gray-800">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No ADP Payroll data available</p>
                    <p className="text-sm">
                      Employee needs to complete ADP Payroll form
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
              {has_adp_data && (
                <button
                  onClick={() => {
                    // Navigate to edit page or open edit modal
                    toast.info("Edit functionality coming soon");
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Edit ADP Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          HR Payout Management
        </h2>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          <FaDownload className="mr-2" />
          Export Data
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={filterDraft}
              onChange={(e) => setFilterDraft(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="true">Draft Only</option>
              <option value="false">Finalized Only</option>
            </select>

            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <FaFilter className="mr-2" />
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ADP Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <FaSpinner className="animate-spin text-2xl text-blue-500 mx-auto mb-2" />
                    <p>Loading employees...</p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.employee_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.employee_name ||
                            employee.employee_full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.employee_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.company_email || employee.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.department || employee.department_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.designation || employee.designation_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(employee.is_draft)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.updated_at
                        ? new Date(employee.updated_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewEmployee(employee.employee_id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FaEye className="inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          // Navigate to edit page
                          toast.info("Edit functionality coming soon");
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FaEdit className="inline mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {showModal && renderEmployeeModal()}
    </div>
  );
};

export default HRPayoutManagement;
