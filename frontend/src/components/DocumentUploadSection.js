import React, { useState, useEffect, useCallback } from "react";
import {
  FaUpload,
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileImage,
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const DocumentUploadSection = ({
  employeeId,
  onDocumentsChange,
  readOnly = false,
}) => {
  const [requirements, setRequirements] = useState({});
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [uploading, setUploading] = useState({});
  const [validation, setValidation] = useState({});

  const fetchRequirements = useCallback(async () => {
    try {
      // Get all document requirements without employment type
      const response = await axios.get(`/documents/requirements`);
      setRequirements(response.data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      toast.error("Failed to load document requirements");
    }
  }, []);

  const fetchUploadedDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/documents/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadedDocuments(response.data);

      // Also fetch validation status
      const validationResponse = await axios.get(
        `/documents/validation/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setValidation(validationResponse.data.validation);
    } catch (error) {
      console.error("Error fetching uploaded documents:", error);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchRequirements();
    if (employeeId) {
      fetchUploadedDocuments();
    }
  }, [employeeId, fetchRequirements, fetchUploadedDocuments]);

  const handleFileUpload = async (documentType, documentCategory, files) => {
    if (!files || files.length === 0) return;

    setUploading((prev) => ({ ...prev, [documentType]: true }));

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
      await axios.post(`/documents/upload/${employeeId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Documents uploaded successfully!");
      fetchUploadedDocuments();

      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error(error.response?.data?.error || "Failed to upload documents");
    } finally {
      setUploading((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const handleSaveDocument = async (documentType, documentCategory) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/documents/save/${employeeId}`,
        {
          documentType,
          documentCategory,
          status: "saved",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Document saved successfully!");
      fetchUploadedDocuments();
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Document deleted successfully!");
      fetchUploadedDocuments();

      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("pdf"))
      return <FaFilePdf className="text-red-500" />;
    if (mimeType?.includes("word") || mimeType?.includes("document"))
      return <FaFileWord className="text-blue-500" />;
    if (mimeType?.includes("image"))
      return <FaFileImage className="text-green-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderDocumentSection = (category, categoryName) => {
    const categoryRequirements = requirements[category] || [];
    const categoryDocuments = uploadedDocuments[category] || [];

    return (
      <div key={category} className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          {category === "employment" && (
            <FaBriefcase className="mr-2 text-blue-600" />
          )}
          {category === "education" && (
            <FaGraduationCap className="mr-2 text-green-600" />
          )}
          {category === "identity" && (
            <FaIdCard className="mr-2 text-purple-600" />
          )}
          {categoryName}
        </h3>

        <div className="space-y-4">
          {categoryRequirements.map((requirement) => {
            const documentType = requirement.type;
            const isRequired = requirement.required;
            const allowMultiple = requirement.multiple;
            const documentsOfType = categoryDocuments.filter(
              (doc) => doc.document_type === documentType
            );
            const hasDocuments = documentsOfType.length > 0;
            const validationInfo = validation[category]?.find(
              (v) => v.type === documentType
            );

            return (
              <div
                key={documentType}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">
                      {requirement.name}
                      <span className="text-blue-500 ml-1">(Optional)</span>
                    </span>
                    {validationInfo && (
                      <span className="ml-2">
                        {validationInfo.isValid ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaExclamationTriangle className="text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {allowMultiple && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Multiple files allowed
                      </span>
                    )}
                    {hasDocuments && (
                      <button
                        onClick={() =>
                          handleSaveDocument(documentType, category)
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Area */}
                {!readOnly && (
                  <div className="mb-3">
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          multiple={allowMultiple}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            handleFileUpload(
                              documentType,
                              category,
                              e.target.files
                            )
                          }
                          className="hidden"
                          disabled={uploading[documentType]}
                        />
                        {uploading[documentType] ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                            Uploading...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <FaUpload className="mr-2 text-gray-400" />
                            Click to upload or drag files here
                          </div>
                        )}
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB per
                      file)
                    </p>
                  </div>
                )}

                {/* Uploaded Documents */}
                {hasDocuments && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Uploaded Files:
                    </h4>
                    {documentsOfType.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                      >
                        <div className="flex items-center">
                          {getFileIcon(document.mime_type)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {document.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(document.file_size)} • Uploaded{" "}
                              {new Date(
                                document.uploaded_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              window.open(
                                `/documents/download/${document.id}`,
                                "_blank"
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Download
                          </button>
                          {!readOnly && (
                            <button
                              onClick={() => handleDeleteDocument(document.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!hasDocuments && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    This document is optional. You can upload it later if
                    needed.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (Object.keys(requirements).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading document requirements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Document Upload
        </h2>
        <p className="text-blue-700 text-sm">
          All documents are optional. You can upload documents as needed and
          save them individually.
        </p>
      </div>

      {requirements.employment &&
        renderDocumentSection("employment", "Employment Documents")}
      {requirements.education &&
        renderDocumentSection("education", "Education Documents")}
      {requirements.identity &&
        renderDocumentSection("identity", "Identity Proof")}
    </div>
  );
};

// Missing imports
const FaBriefcase = ({ className }) => <span className={className}>💼</span>;
const FaGraduationCap = ({ className }) => (
  <span className={className}>🎓</span>
);
const FaIdCard = ({ className }) => <span className={className}>🆔</span>;

export default DocumentUploadSection;
