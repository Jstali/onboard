import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaSignOutAlt, FaUserEdit, FaCalendarAlt, FaCheckCircle, FaClock, FaClipboardList, FaCalendarPlus } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import OnboardingForm from './OnboardingForm';
import OnboardingStatus from './OnboardingStatus';
import { Link } from 'react-router-dom';

const EmployeeDashboard = () => {
  const { logout } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
    checkIfOnboarded();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/employee/onboarding-status');
      setOnboardingStatus(response.data);
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfOnboarded = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/employee/is-onboarded');
      setIsOnboarded(response.data.isOnboarded);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ONDOARD Employee Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isOnboarded && (
                <a
                  href="/attendance"
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200"
                >
                  <FaCalendarAlt className="mr-2" />
                  Attendance Portal
                </a>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <FaUserEdit className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">Welcome to ONDOARD!</h2>
              <p className="text-gray-600">
                Complete your onboarding process to get started with the company.
              </p>
            </div>
          </div>
        </div>

        {/* Onboarding Status */}
        {onboardingStatus && (
          <OnboardingStatus 
            status={onboardingStatus} 
            onRefresh={checkOnboardingStatus}
          />
        )}

        {/* Onboarding Form or Success Message */}
        {onboardingStatus?.hasForm ? (
          onboardingStatus.status === 'approved' ? (
            <div className="bg-success-50 border border-success-200 rounded-lg p-6">
              <div className="flex items-center">
                <FaCheckCircle className="w-8 h-8 text-success-600 mr-4" />
                <div>
                  <h3 className="text-lg font-medium text-success-800">
                    Onboarding Completed Successfully!
                  </h3>
                  <p className="text-success-700 mt-1">
                    You can now access the attendance portal and other employee features.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href="/attendance"
                  className="btn-success inline-flex items-center"
                >
                  <FaCalendarAlt className="mr-2" />
                  Go to Attendance Portal
                </a>
              </div>
            </div>
          ) : onboardingStatus.status === 'submitted' ? (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center mr-4">
                  <div className="w-4 h-4 bg-warning-600 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-warning-800">
                    Form Submitted Successfully!
                  </h3>
                  <p className="text-warning-700 mt-1">
                    Your onboarding form has been submitted and is awaiting HR approval.
                    You will be notified once it's approved.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <OnboardingForm onSuccess={checkOnboardingStatus} />
          )
        ) : (
          <OnboardingForm onSuccess={checkOnboardingStatus} />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/attendance"
            className="bg-blue-600 text-white p-6 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            <div className="flex items-center">
              <FaCalendarAlt className="text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-semibold">Mark Attendance</h3>
                <p className="text-blue-100">Record your daily attendance</p>
              </div>
            </div>
          </Link>

          <Link
            to="/leave-request"
            className="bg-green-600 text-white p-6 rounded-lg shadow-lg hover:bg-green-700 transition-colors"
          >
            <div className="flex items-center">
              <FaCalendarPlus className="text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-semibold">Leave Request</h3>
                <p className="text-green-100">Submit leave applications</p>
              </div>
            </div>
          </Link>

          <div className="bg-purple-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <FaClock className="text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-semibold">My Schedule</h3>
                <p className="text-purple-100">View your work schedule</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
