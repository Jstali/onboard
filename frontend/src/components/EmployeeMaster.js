import React from "react";
import { FaUser, FaEnvelope, FaIdCard, FaCalendarAlt } from "react-icons/fa";

const EmployeeMaster = ({ employees }) => {
  return (
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
            </tr>
          ))}
        </tbody>
      </table>

      {employees.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <FaUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">No employees in master table</p>
            <p className="text-sm">
              Employees will appear here after their onboarding forms are
              approved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMaster;
