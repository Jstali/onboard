import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaCalendarAlt,
  FaPlus,
  FaTimes,
  FaEye,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import ManualEmployeeAdd from "./ManualEmployeeAdd";

const EmployeeMaster = ({ employees, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [managers, setManagers] = useState([]);

  const handleEmployeeAdded = () => {
    setShowAddForm(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get("/hr-config/managers");
      setManagers(response.data.managers);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      employee_name: employee.employee_name,
      company_email: employee.company_email,
      type: employee.type,
      doj: employee.doj,
      status: employee.status,
      department: employee.department || "",
      designation: employee.designation || "",
      salary_band: employee.salary_band || "",
      location: employee.location || "",
      manager_id: employee.manager_id || "",
      manager2_id: employee.manager2_id || "",
      manager3_id: employee.manager3_id || "",
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateEmployee = async () => {
    try {
      await axios.put(`/hr/master/${editingEmployee.id}`, editFormData);
      setShowEditModal(false);
      setEditingEmployee(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      alert(error.response?.data?.error || "Failed to update employee");
    }
  };

  return (
    <div>
      {/* Header with Add Employee Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Employee Master Table
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center"
        >
          {showAddForm ? (
            <>
              <FaTimes className="mr-2" />
              Hide Form
            </>
          ) : (
            <>
              <FaPlus className="mr-2" />
              Add Employee
            </>
          )}
        </button>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <div className="mb-8">
          <React.Suspense fallback={<div>Loading form...</div>}>
            <ManualEmployeeAdd onEmployeeAdded={handleEmployeeAdded} />
          </React.Suspense>
        </div>
      )}

      {/* Employee Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Joining
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Managers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <FaUser className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.employee_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <FaIdCard className="w-3 h-3 mr-1" />
                        {employee.employee_id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaEnvelope className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {employee.company_email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                    {employee.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaCalendarAlt className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(employee.doj).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {employee.manager_name && (
                      <div className="mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {employee.manager_name}
                        </span>
                      </div>
                    )}
                    {employee.manager2_name && (
                      <div className="mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {employee.manager2_name}
                        </span>
                      </div>
                    )}
                    {employee.manager3_name && (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {employee.manager3_name}
                        </span>
                      </div>
                    )}
                    {!employee.manager_name &&
                      !employee.manager2_name &&
                      !employee.manager3_name && (
                        <span className="text-gray-500 italic">
                          No Managers
                        </span>
                      )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.status === "active"
                        ? "bg-success-100 text-success-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {employee.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      alert(
                        `Employee: ${employee.employee_name}\nID: ${
                          employee.employee_id
                        }\nEmail: ${employee.company_email}\nType: ${
                          employee.type
                        }\nDOJ: ${new Date(
                          employee.doj
                        ).toLocaleDateString()}\nManager: ${
                          employee.display_manager_name || "Not Assigned"
                        }\nStatus: ${employee.status}`
                      );
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="View"
                  >
                    <FaEye className="inline" />
                  </button>
                  <button
                    onClick={() => handleEditEmployee(employee)}
                    className="text-green-600 hover:text-green-900 mr-3"
                    title="Edit"
                  >
                    <FaEdit className="inline" />
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Delete ${employee.employee_name} from master?`
                        )
                      )
                        return;
                      try {
                        await axios.delete(
                          `http://localhost:5001/api/hr/master/${employee.id}`
                        );
                        if (onRefresh) onRefresh();
                      } catch (e) {
                        console.error(e);
                        alert(
                          e.response?.data?.error || "Failed to delete employee"
                        );
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FaTrash className="inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {employees.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">
              <FaUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">
                No employees in master table
              </p>
              <p className="text-sm">
                Employees will appear here after their onboarding forms are
                approved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Employee
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateEmployee();
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      name="employee_name"
                      value={editFormData.employee_name || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Company Email
                    </label>
                    <input
                      type="email"
                      name="company_email"
                      value={editFormData.company_email || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Employment Type
                    </label>
                    <select
                      name="type"
                      value={editFormData.type || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Full-Time">Full-Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Joining
                    </label>
                    <input
                      type="date"
                      name="doj"
                      value={editFormData.doj || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editFormData.status || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={editFormData.department || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={editFormData.designation || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Manager 1 (Optional)
                    </label>
                    <select
                      name="manager_id"
                      value={editFormData.manager_id || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Manager 1</option>
                      {managers &&
                        managers.map((manager) => (
                          <option
                            key={manager.manager_id}
                            value={manager.manager_id}
                          >
                            {manager.manager_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Manager 2 (Optional)
                    </label>
                    <select
                      name="manager2_id"
                      value={editFormData.manager2_id || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Manager 2</option>
                      {managers &&
                        managers.map((manager) => (
                          <option
                            key={manager.manager_id}
                            value={manager.manager_id}
                          >
                            {manager.manager_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Manager 3 (Optional)
                    </label>
                    <select
                      name="manager3_id"
                      value={editFormData.manager3_id || ""}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Manager 3</option>
                      {managers &&
                        managers.map((manager) => (
                          <option
                            key={manager.manager_id}
                            value={manager.manager_id}
                          >
                            {manager.manager_name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Update Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMaster;
