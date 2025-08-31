import React, { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBriefcase,
  FaCalendarAlt,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import DocumentUploadSection from "./DocumentUploadSection";

const OnboardingForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    education: "",
    experience: "",
    doj: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });
  const [employmentType, setEmploymentType] = useState("Full-Time");

  const [loading, setLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [submittedUserId, setSubmittedUserId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5001/api/employee/onboarding-form",
        {
          type: employmentType,
          formData: {
            ...formData,
            employmentType,
            submittedAt: new Date().toISOString(),
          },
          files: [], // No files in basic form - handled separately in document upload
        }
      );

      // Store the user ID for document uploads
      setSubmittedUserId(response.data.userId);

      toast.success(
        "Basic form submitted successfully! Please upload required documents."
      );
      setShowDocuments(true);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to submit form");
      setLoading(false);
    }
  };

  const handleDocumentsComplete = () => {
    toast.success("Onboarding completed successfully!");
    onSuccess();
  };

  if (showDocuments) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">Document Upload</h3>
          <p className="text-sm text-gray-600 mt-1">
            Please upload the required documents for your {employmentType}{" "}
            position.
          </p>
        </div>

        <DocumentUploadSection
          employmentType={employmentType}
          employeeId={submittedUserId}
          onDocumentsChange={() => {}}
        />

        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>📋 Document uploads are optional.</p>
            <p>You can upload missing documents later from your profile.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDocumentsComplete}
              className="btn-secondary px-6 py-3"
            >
              Skip Documents & Complete
            </button>
            <button
              onClick={handleDocumentsComplete}
              className="btn-primary px-6 py-3"
            >
              Complete Onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Complete Your Onboarding
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employment Type *
          </label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="input-field"
            required
          >
            <option value="Full-Time">Full-Time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
            <option value="Manager">Manager</option>
          </select>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-3 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Joining *
            </label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                name="doj"
                value={formData.doj}
                onChange={handleInputChange}
                className="input-field pl-10"
                required
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <div className="relative">
            <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        {/* Education & Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education *
            </label>
            <div className="relative">
              <FaGraduationCap className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                rows={3}
                className="input-field pl-10"
                placeholder="Degree, Institution, Year"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Experience
            </label>
            <div className="relative">
              <FaBriefcase className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                rows={3}
                className="input-field pl-10"
                placeholder="Previous companies, roles, duration"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Emergency Contact
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name *
              </label>
              <input
                type="text"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone *
              </label>
              <input
                type="tel"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship *
              </label>
              <input
                type="text"
                name="emergencyContact.relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., Spouse, Parent"
                required
              />
            </div>
          </div>
        </div>

        {/* Note about documents */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            📄 Document Upload
          </h4>
          <p className="text-sm text-blue-700">
            After submitting this form, you'll be able to upload required
            documents based on your employment type ({employmentType}).
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-8 py-3"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              "Submit Onboarding Form"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingForm;
