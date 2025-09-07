import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaSave,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";

const EmployeeCRUD = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    type: "Full-Time",
    status: "active",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/hr/employees");
      console.log("🔍 Employee data received:", response.data.employees);
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      type: "Full-Time",
    });
  };

  const handleCreate = async () => {
    try {
      if (!formData.email || !formData.first_name || !formData.last_name) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const employeeData = {
        name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email, // Personal email
        type: formData.type,
        doj: new Date().toISOString().split("T")[0], // Send only date part (YYYY-MM-DD)
      };

      console.log("Sending employee data:", employeeData);

      await axios.post("http://localhost:5001/api/hr/employees", employeeData);

      toast.success("Employee created successfully");
      setShowAddModal(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error("Error creating employee:", error);
      console.error("Error response:", error.response?.data);

      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error;
        if (errorMessage) {
          toast.error(errorMessage);
        } else {
          toast.error("Something went wrong, please try again.");
        }
      } else {
        // Handle other errors with generic message
        toast.error("Something went wrong, please try again.");
      }
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      type: employee.assigned_job_role || "Full-Time",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      if (!selectedEmployee) return;

      await axios.put(
        `http://localhost:5001/api/hr/employees/${selectedEmployee.id}`,
        formData
      );

      toast.success("Employee updated successfully");
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(error.response?.data?.error || "Failed to update employee");
    }
  };

  const handleView = async (employee) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/hr/employees/${employee.id}`
      );
      setSelectedEmployee(response.data.employee);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast.error("Failed to fetch employee details");
    }
  };

  const handleDelete = async (employee) => {
    const employeeName =
      employee.first_name && employee.last_name
        ? `${employee.first_name} ${employee.last_name}`
        : employee.first_name ||
          employee.last_name ||
          employee.email ||
          "this employee";

    if (!window.confirm(`Are you sure you want to delete ${employeeName}?`)) {
      return;
    }

    try {
      await axios.delete(`/hr/employees/${employee.id}`);
      toast.success("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(error.response?.data?.error || "Failed to delete employee");
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${employee.first_name || ""} ${
      employee.last_name || ""
    }`.trim();
    return (
      fullName.toLowerCase().includes(searchLower) ||
      (employee.email?.toLowerCase() || "").includes(searchLower) ||
      (employee.assigned_job_role?.toLowerCase() || "").includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return status === "active"
      ? `${baseClasses} bg-brand-green text-brand-black`
      : `${baseClasses} bg-brand-red text-brand-black`;
  };

  const getRoleBadge = (role) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (role) {
      case "Full-Time":
        return `${baseClasses} bg-brand-green text-brand-black`;
      case "Contract":
        return `${baseClasses} bg-brand-blue text-brand-black`;
      case "Intern":
        return `${baseClasses} bg-brand-yellow text-brand-black`;
      case "Product Developer":
        return `${baseClasses} bg-brand-violet text-brand-black`;
      case "hr":
        return `${baseClasses} bg-brand-violet text-brand-black`;
      case "manager":
        return `${baseClasses} bg-brand-blue text-brand-black`;
      case "Not Assigned":
        return `${baseClasses} bg-brand-pearl text-brand-black/60`;
      default:
        return `${baseClasses} bg-brand-pearl text-brand-black`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-pearl p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="text-xl font-semibold text-brand-black">
          Employee Management
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand-green text-brand-black px-4 py-2 rounded-lg hover:bg-hover-primary transition-colors flex items-center gap-2 shadow-md"
        >
          <FaPlus />
          Add Employee
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-brand-pearl rounded-lg shadow-md border border-brand-black/10 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-green" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-brand-pearl border border-brand-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green placeholder:text-brand-black/50 text-sm text-brand-black"
            />
          </div>
          <button
            onClick={fetchEmployees}
            className="text-brand-black bg-brand-green px-4 py-2 rounded-lg hover:bg-hover-primary transition-colors text-sm font-medium shadow-md"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-brand-pearl shadow-md rounded-lg overflow-hidden border border-brand-black/10">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12 bg-brand-pearl">
            <FaUser className="mx-auto text-brand-green text-4xl mb-4" />
            <h3 className="text-lg font-medium text-brand-black mb-2">
              No Employees Found
            </h3>
            <p className="text-brand-black/60">
              {searchTerm
                ? "No employees match your search."
                : "No employees added yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-brand-pearl border-b border-brand-black/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Managers
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-brand-pearl divide-y divide-brand-black/10">
                {filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`${index % 2 === 0 ? 'bg-brand-pearl' : 'bg-ui-secondary'} border-b border-brand-black/5 hover:bg-ui-secondary transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                          <FaUser className="text-brand-green" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-brand-black">
                            {employee.first_name && employee.last_name
                              ? `${employee.first_name} ${employee.last_name}`
                              : employee.first_name ||
                                employee.last_name ||
                                employee.email ||
                                "Unknown Employee"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-brand-black">
                        {employee.assigned_employee_id ? (
                          <span className="font-mono">
                            {employee.assigned_employee_id}
                          </span>
                        ) : (
                          <span className="text-brand-black/50 italic">
                            Not Assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-brand-black">
                        {employee.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={getRoleBadge(employee.assigned_job_role)}
                      >
                        {employee.assigned_job_role || "Not Assigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-brand-black">
                        {employee.assigned_manager && (
                          <div className="mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-blue/20 text-brand-blue">
                              {employee.assigned_manager}
                            </span>
                          </div>
                        )}
                        {employee.manager2_name && (
                          <div className="mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-green/20 text-brand-green">
                              {employee.manager2_name}
                            </span>
                          </div>
                        )}
                        {employee.manager3_name && (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-violet/20 text-brand-violet">
                              {employee.manager3_name}
                            </span>
                          </div>
                        )}
                        {!employee.assigned_manager &&
                          !employee.manager2_name &&
                          !employee.manager3_name && (
                            <span className="text-brand-black/50 italic">
                              No Managers
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(employee.status)}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.created_at
                        ? format(new Date(employee.created_at), "MMM dd, yyyy")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleView(employee)}
                          className="text-brand-green hover:text-state-hover p-1 transition-colors rounded"
                          title="View Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-brand-blue hover:text-brand-violet p-1 transition-colors rounded"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
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
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-brand-black/10 w-96 shadow-lg rounded-lg bg-brand-pearl">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-brand-black mb-4">
                Add New Employee
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full border border-brand-black/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full border border-brand-black/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-brand-black/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    Employment Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border border-brand-black/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
                    required
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-brand-black bg-brand-violet rounded-lg hover:bg-hover-secondary transition-colors shadow-md"
                >
                  <FaTimes className="mr-2 inline" />
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 text-sm font-medium text-brand-black bg-brand-green rounded-lg hover:bg-hover-primary transition-colors shadow-md"
                >
                  <FaSave className="mr-2 inline" />
                  Create Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-brand-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-brand-black/10 w-96 shadow-lg rounded-lg bg-brand-pearl">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-brand-black mb-4">
                Edit Employee
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full border border-brand-black/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full border border-brand-black/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-brand-black/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    Employment Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border border-brand-black/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-pearl text-brand-black"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-brand-black bg-brand-violet rounded-lg hover:bg-hover-secondary transition-colors shadow-md"
                >
                  <FaTimes className="mr-2 inline" />
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 text-sm font-medium text-brand-black bg-brand-green rounded-lg hover:bg-hover-primary transition-colors shadow-md"
                >
                  <FaSave className="mr-2 inline" />
                  Update Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-brand-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border border-brand-black/10 w-96 shadow-lg rounded-lg bg-brand-pearl">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-brand-black mb-4">
                Employee Details
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-brand-black">Name:</span>
                  <span className="text-brand-black">
                    {selectedEmployee.first_name && selectedEmployee.last_name
                      ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                      : selectedEmployee.first_name ||
                        selectedEmployee.last_name ||
                        selectedEmployee.email ||
                        "Unknown Employee"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-brand-black">
                    Employee ID:
                  </span>
                  <span className="text-brand-black">
                    {selectedEmployee.assigned_employee_id ? (
                      <span className="font-mono bg-brand-green/20 text-brand-green px-2 py-1 rounded text-sm">
                        {selectedEmployee.assigned_employee_id}
                      </span>
                    ) : (
                      <span className="text-brand-black/50 italic">
                        Not Assigned
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-brand-black">Email:</span>
                  <span className="text-brand-black">
                    {selectedEmployee.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-brand-black">Role:</span>
                  <span
                    className={getRoleBadge(selectedEmployee.assigned_job_role)}
                  >
                    {selectedEmployee.assigned_job_role || "Not Assigned"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-brand-black">Status:</span>
                  <span className={getStatusBadge(selectedEmployee.status)}>
                    {selectedEmployee.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-brand-black">Created:</span>
                  <span className="text-brand-black">
                    {selectedEmployee.created_at
                      ? format(
                          new Date(selectedEmployee.created_at),
                          "MMM dd, yyyy"
                        )
                      : "-"}
                  </span>
                </div>
                {selectedEmployee.form_name && (
                  <div className="flex justify-between">
                    <span className="font-medium text-brand-black">
                      Form Name:
                    </span>
                    <span className="text-brand-black">
                      {selectedEmployee.form_name}
                    </span>
                  </div>
                )}
                {selectedEmployee.phone && (
                  <div className="flex justify-between">
                    <span className="font-medium text-brand-black">Phone:</span>
                    <span className="text-brand-black">
                      {selectedEmployee.phone}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-brand-black bg-brand-green rounded-lg hover:bg-hover-primary shadow-md transition-colors"
                >
                  <FaTimes className="mr-2 inline" />
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

export default EmployeeCRUD;
