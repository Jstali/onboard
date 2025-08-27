import React from 'react';
import { FaInfoCircle, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const OnboardingStatus = ({ status }) => {
  if (!status) return null;

  const getStatusIcon = () => {
    switch (status.status) {
      case 'approved':
        return <FaCheckCircle className="w-6 h-6 text-success-600" />;
      case 'submitted':
        return <FaClock className="w-6 h-6 text-warning-600" />;
      default:
        return <FaInfoCircle className="w-6 h-6 text-primary-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'approved':
        return 'bg-success-50 border-success-200 text-success-800';
      case 'submitted':
        return 'bg-warning-50 border-warning-200 text-warning-800';
      default:
        return 'bg-primary-50 border-primary-200 text-primary-800';
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${getStatusColor()}`}>
      <div className="flex items-center">
        {getStatusIcon()}
        <div className="ml-3">
          <h3 className="text-lg font-medium">
            Onboarding Status: {status.status?.charAt(0).toUpperCase() + status.status?.slice(1) || 'Not Started'}
          </h3>
          <p className="text-sm mt-1">
            {status.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStatus;
