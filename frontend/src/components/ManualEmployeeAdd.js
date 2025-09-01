import React, { useState, useEffect } from "react";
import {
  FaUserPlus,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const ManualEmployeeAdd = ({ onEmployeeAdded }) => {
  const { token } = useAuth();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Debug logging
  console.log("🔍 ManualEmployeeAdd mounted - Token:", !!token);
  console.log("🔍 ManualEmployeeAdd - Managers count:", managers.length);

  const [formData, setFormData] = useState({
    email: "",
    employeeName: "",
    companyEmail: "",
    managerId: "",
    managerName: "",
    manager2Id: "",
    manager2Name: "",
    manager3Id: "",
    manager3Name: "",
    department: "",
    location: "",
    role: "Product Developer",
    doj: "",
  });

  // Fetch managers for dropdown
  useEffect(() => {
    if (token) {
      fetchManagers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Ensure formData is always properly initialized
  useEffect(() => {
    setFormData({
      email: "",
      employeeName: "",
      employeeId: "",
      companyEmail: "",
      managerId: "",
      managerName: "",
      manager2Id: "",
      manager2Name: "",
      manager3Id: "",
      manager3Name: "",
      department: "",
      location: "",
      role: "Product Developer",
      doj: "",
    });
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/hr/managers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setManagers(data.managers);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Ensure value is always a string to prevent controlled/uncontrolled warnings
    const stringValue = value || "";

    setFormData((prev) => ({
      ...prev,
      [name]: stringValue,
    }));

    // Auto-fill manager name when manager ID is selected
    if (name === "managerId") {
      const selectedManager = managers.find(
        (m) => m.manager_id === stringValue
      );
      if (selectedManager) {
        setFormData((prev) => ({
          ...prev,
          managerName: selectedManager.manager_name || "",
        }));
      }
    } else if (name === "manager2Id") {
      const selectedManager = managers.find(
        (m) => m.manager_id === stringValue
      );
      if (selectedManager) {
        setFormData((prev) => ({
          ...prev,
          manager2Name: selectedManager.manager_name || "",
        }));
      }
    } else if (name === "manager3Id") {
      const selectedManager = managers.find(
        (m) => m.manager_id === stringValue
      );
      if (selectedManager) {
        setFormData((prev) => ({
          ...prev,
          manager3Name: selectedManager.manager_name || "",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate date format
    if (!formData.doj) {
      setError("Date of Joining is required");
      setLoading(false);
      return;
    }

    // Ensure date is in YYYY-MM-DD format
    const dateObj = new Date(formData.doj);
    if (isNaN(dateObj.getTime())) {
      setError("Invalid date format. Please select a valid date.");
      setLoading(false);
      return;
    }

    try {
      console.log("🔍 Frontend - Token available:", !!token);
      console.log("🔍 Frontend - Form data being sent:", formData);
      console.log(
        "🔍 Frontend - Request URL:",
        "http://localhost:5001/api/hr/master-employees"
      );

      const response = await fetch(
        "http://localhost:5001/api/hr/master-employees",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      console.log("🔍 Frontend - Response status:", response.status);
      console.log("🔍 Frontend - Response data:", data);

      if (response.ok) {
        setSuccess(true);
        setFormData({
          email: "",
          employeeName: "",
          employeeId: "",
          companyEmail: "",
          managerId: "",
          managerName: "",
          department: "",
          location: "",
          doj: "",
        });

        // Call callback to refresh parent component
        if (onEmployeeAdded) {
          onEmployeeAdded();
        }

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || "Failed to add employee");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      employeeName: "",
      employeeId: "",
      companyEmail: "",
      managerId: "",
      managerName: "",
      department: "",
      location: "",
      role: "Product Developer",
      doj: "",
    });
    setError("");
    setSuccess(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUserPlus className="mr-3 text-blue-600" />
          Manually Add Employee to Master Table
        </h2>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-600 mr-2" />
            <span className="text-green-800 font-medium">
              Employee added successfully! An onboarding email has been sent.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-600 mr-2" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Personal Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="personal@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name *
              </label>
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName || ""}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Joining *
              </label>
              <input
                type="date"
                name="doj"
                value={formData.doj || ""}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Company Information
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Employee ID will be automatically
                generated as a unique 6-digit number when you submit this form.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Email *
              </label>
              <input
                type="email"
                name="companyEmail"
                value={formData.companyEmail || ""}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="employee@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department (Optional)
              </label>
              <input
                type="text"
                name="department"
                value={formData.department || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role || ""}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                <option value="Product Developer">Product Developer</option>
                <option value="SAP">SAP</option>
                <option value="Income Management">Income Management</option>
                <option value="Integration">Integration</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manager Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Manager Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager 1 (Required)
              </label>
              <select
                name="managerId"
                value={formData.managerId || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.manager_id}>
                    {manager.manager_name} - {manager.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager 1 Name (Auto-filled)
              </label>
              <input
                type="text"
                name="managerName"
                value={formData.managerName || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Will be auto-filled"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager 2 (Optional)
              </label>
              <select
                name="manager2Id"
                value={formData.manager2Id || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Manager (Optional)</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.manager_id}>
                    {manager.manager_name} - {manager.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager 2 Name (Auto-filled)
              </label>
              <input
                type="text"
                name="manager2Name"
                value={formData.manager2Name || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Will be auto-filled"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager 3 (Optional)
              </label>
              <select
                name="manager3Id"
                value={formData.manager3Id || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Manager (Optional)</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.manager_id}>
                    {manager.manager_name} - {manager.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager 3 Name (Auto-filled)
              </label>
              <input
                type="text"
                name="manager3Name"
                value={formData.manager3Name || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Will be auto-filled"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Additional Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hyderabad"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center"
          >
            <FaTimes className="mr-2" />
            Reset
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Add Employee
              </>
            )}
          </button>
        </div>
      </form>

      {/* Information Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">
          What happens when you add an employee here?
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Employee account is created with temporary password</li>
          <li>• Employee is added directly to the master employee table</li>
          <li>• Leave balance is initialized (15 days per year)</li>
          <li>• Onboarding email is sent with login credentials</li>
          <li>
            • Employee can immediately access attendance and leave systems
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ManualEmployeeAdd;
