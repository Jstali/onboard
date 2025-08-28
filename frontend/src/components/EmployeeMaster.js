import React, { useState } from "react";
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
} from "react-icons/fa";
import ManualEmployeeAdd from "./ManualEmployeeAdd";

const EmployeeMaster = ({ employees, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEmployeeAdded = () => {
    setShowAddForm(false);
    if (onRefresh) {
      onRefresh();
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
                Manager
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.manager_id || "Not Assigned"}
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
                          employee.manager_id || "Not Assigned"
                        }\nStatus: ${employee.status}`
                      );
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="View"
                  >
                    <FaEye className="inline" />
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
    </div>
  );
};

export default EmployeeMaster;
