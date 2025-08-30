import React, { useState, useEffect, useCallback } from "react";
import {
  FaCheck,
  FaExclamationTriangle,
  FaClock,
  FaUpload,
  FaEye,
  FaFileAlt,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import DocumentUploadSection from "./DocumentUploadSection";

const DocumentStatus = ({
  employeeId,
  employeeName,
  employmentType,
  isHR = false,
  readOnly = false,
}) => {
  const [validation, setValidation] = useState({});
  const [loading, setLoading] = useState(true);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [overallStatus, setOverallStatus] = useState({});
  const [editingDocument, setEditingDocument] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchValidation = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5001/api/documents/validation/${employeeId}/${employmentType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setValidation(response.data.validation);
      setOverallStatus({
        allRequiredUploaded: response.data.allRequiredUploaded,
        totalRequired: getTotalRequired(response.data.validation),
        uploadedRequired: getUploadedRequired(response.data.validation),
      });
    } catch (error) {
      console.error("Error fetching validation:", error);
    } finally {
      setLoading(false);
    }
  }, [employeeId, employmentType]);

  useEffect(() => {
    if (employeeId && employmentType) {
      fetchValidation();
    }
  }, [employeeId, employmentType]);

  const getTotalRequired = (validation) => {
    let total = 0;
    Object.keys(validation).forEach((category) => {
      validation[category].forEach((req) => {
        if (req.required) total++;
      });
    });
    return total;
  };

  const getUploadedRequired = (validation) => {
    let uploaded = 0;
    Object.keys(validation).forEach((category) => {
      validation[category].forEach((req) => {
        if (req.required && req.uploaded > 0) uploaded++;
      });
    });
    return uploaded;
  };

  const handleEditDocument = (documentType, documentCategory) => {
    setEditingDocument({ type: documentType, category: documentCategory });
    setShowEditModal(true);
  };

  const handleDeleteDocument = async (documentType) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Find the document ID for this type
      const documents = await axios.get(
        `http://localhost:5001/api/documents/employee/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allDocs = Object.values(documents.data).flat();
      const docToDelete = allDocs.find(
        (doc) => doc.document_type === documentType
      );

      if (docToDelete) {
        await axios.delete(
          `http://localhost:5001/api/documents/${docToDelete.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Document deleted successfully!");
        fetchValidation();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleReplaceDocument = async (
    documentType,
    documentCategory,
    files
  ) => {
    if (!files || files.length === 0) return;

    try {
      const formData = new FormData();
      const documentTypes = [];
      const documentCategories = [];

      Array.from(files).forEach((file, index) => {
        formData.append("documents", file);
        documentTypes.push(documentType);
        documentCategories.push(documentCategory);
      });

      formData.append("documentTypes", JSON.stringify(documentTypes));
      formData.append("documentCategories", JSON.stringify(documentCategories));

      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5001/api/documents/upload/${employeeId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Document replaced successfully!");
      setShowEditModal(false);
      setEditingDocument(null);
      fetchValidation();
    } catch (error) {
      console.error("Error replacing document:", error);
      toast.error(error.response?.data?.error || "Failed to replace document");
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "employment":
        return "💼";
      case "education":
        return "🎓";
      case "identity":
        return "🆔";
      default:
        return "📄";
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case "employment":
        return "Employment Documents";
      case "education":
        return "Education Documents";
      case "identity":
        return "Identity Proof";
      default:
        return "Other Documents";
    }
  };

  const getDocumentStatusBadge = (requirement) => {
    if (requirement.uploaded > 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheck className="mr-1" />
          Uploaded ({requirement.uploaded})
        </span>
      );
    } else if (requirement.required) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaExclamationTriangle className="mr-1" />
          Required - Missing
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <FaClock className="mr-1" />
          Optional - Not uploaded
        </span>
      );
    }
  };

  const getOverallStatusBadge = () => {
    const { totalRequired, uploadedRequired } = overallStatus;

    if (uploadedRequired === totalRequired) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <FaCheck className="mr-2" />
          Complete ({uploadedRequired}/{totalRequired})
        </span>
      );
    } else if (uploadedRequired > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="mr-2" />
          Partial ({uploadedRequired}/{totalRequired})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <FaExclamationTriangle className="mr-2" />
          Pending ({uploadedRequired}/{totalRequired})
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading document status...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaFileAlt className="mr-2 text-blue-600" />
              Document Status
              {employeeName && (
                <span className="ml-2 text-gray-600">- {employeeName}</span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Employment Type:{" "}
              <span className="font-medium">{employmentType}</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getOverallStatusBadge()}
            {!isHR && (
              <button
                onClick={() => setShowUploadSection(!showUploadSection)}
                className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <FaUpload className="mr-1" />
                {showUploadSection ? "Hide Upload" : "Upload Documents"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Status List */}
      <div className="p-6">
        {Object.keys(validation).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No document requirements found for this employment type.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(validation).map(([category, requirements]) => (
              <div key={category}>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">{getCategoryIcon(category)}</span>
                  {getCategoryName(category)}
                </h4>

                <div className="space-y-2">
                  {requirements.map((requirement) => (
                    <div key={requirement.type} className="mb-3">
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {requirement.name}
                            {requirement.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </span>
                          {requirement.multiple && (
                            <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              Multiple files allowed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getDocumentStatusBadge(requirement)}
                          {requirement.uploaded > 0 && !readOnly && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() =>
                                  handleEditDocument(requirement.type, category)
                                }
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Replace document"
                              >
                                <FaEdit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDocument(requirement.type)
                                }
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete document"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Individual Upload Button for each document */}
                      {!readOnly && (
                        <div className="mt-2 ml-3">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            multiple={requirement.multiple}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleReplaceDocument(
                                  requirement.type,
                                  category,
                                  e.target.files
                                );
                              }
                            }}
                            className="hidden"
                            id={`upload-${requirement.type}`}
                          />
                          <label
                            htmlFor={`upload-${requirement.type}`}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 cursor-pointer"
                          >
                            <FaUpload className="w-3 h-3 mr-1" />
                            Upload
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HR Actions */}
        {isHR && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">HR Actions</h4>
              <p className="text-sm text-blue-700 mb-3">
                This employee can be approved even with missing documents.
                Documents can be uploaded later during employment.
              </p>
              <div className="flex space-x-2">
                <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                  <FaCheck className="mr-1" />
                  Approve Employee
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <FaEye className="mr-1" />
                  View All Documents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Upload Section */}
        {!isHR && showUploadSection && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Upload Documents
              </h4>
              <p className="text-sm text-gray-600">
                Upload any missing documents. All uploads are optional and can
                be done anytime.
              </p>
            </div>
            <DocumentUploadSection
              employmentType={employmentType}
              employeeId={employeeId}
              onDocumentsChange={fetchValidation}
              readOnly={false}
            />
          </div>
        )}
      </div>

      {/* Edit Document Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Replace Document
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload a new file to replace the existing document for:{" "}
                <strong>
                  {editingDocument.type.replace(/_/g, " ").toUpperCase()}
                </strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New File
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleReplaceDocument(
                        editingDocument.type,
                        editingDocument.category,
                        e.target.files
                      );
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDocument(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDocument(editingDocument.type)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentStatus;
