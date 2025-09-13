import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaSave, FaEdit, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

const ADPPayrollForm = ({ employeeId, isReadOnly = false }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [fieldMapping, setFieldMapping] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  // Field mapping from backend
  const FIELD_MAPPING = {
    "Employee ID": "employee_id",
    "NamePrefix": "name_prefix",
    "Employee Full Name": "employee_full_name",
    "GivenOrFirstName": "given_or_first_name",
    "MiddleName": "middle_name",
    "LastName": "last_name",
    "Joining date": "joining_date",
    "PayrollStartingMonth": "payroll_starting_month",
    "DOB": "dob",
    "Aadhar": "aadhar",
    "NameAsPerAadhar": "name_as_per_aadhar",
    "Designationdescription": "designation_description",
    "Email": "email",
    "AlternateEmail": "alternate_email",
    "PAN": "pan",
    "NameAsPerPAN": "name_as_per_pan",
    "Gender": "gender",
    "Departmentdescription": "department_description",
    "Work Location": "work_location",
    "LabourStateDescription": "labour_state_description",
    "LWFDesignation": "lwf_designation",
    "LWFRelationship": "lwf_relationship",
    "LWFID": "lwf_id",
    "ProfessionaltaxgroupDescription": "professional_tax_group_description",
    "PFComputationalGroup": "pf_computational_group",
    "Mobile Number": "mobile_number",
    "PhoneNumber1": "phone_number1",
    "PhoneNumber2": "phone_number2",
    "Address1": "address1",
    "Address2": "address2",
    "Address3": "address3",
    "City": "city",
    "State": "state",
    "PinCode": "pincode",
    "Country": "country",
    "Nationality": "nationality",
    "IWNationality": "iw_nationality",
    "IWCity": "iw_city",
    "IWCountry": "iw_country",
    "COCIssuingAuthority": "coc_issuing_authority",
    "COCIssueDate": "coc_issue_date",
    "COCFromDate": "coc_from_date",
    "COCUptoDate": "coc_upto_date",
    "BankName": "bank_name",
    "NameAsPerBank": "name_as_per_bank",
    "Accountno": "account_no",
    "BankIFSCCode": "bank_ifsc_code",
    "PaymentMode": "payment_mode",
    "PFaccountno": "pf_account_no",
    "ESIaccountno": "esi_account_no",
    "ESIAboveWageLimit": "esi_above_wage_limit",
    "UAN": "uan",
    "Branchdescription": "branch_description",
    "EnrollmentID": "enrollment_id",
    "ManagerEmployeeID": "manager_employee_id",
    "Taxregime": "tax_regime",
    "Fathername": "father_name",
    "MotherName": "mother_name",
    "SpouseName": "spouse_name",
    "MaritalStatus": "marital_status",
    "NumberOfChildren": "number_of_children",
    "DisabilityStatus": "disability_status",
    "TypeOfDisability": "type_of_disability",
    "Employment Type": "employment_type",
    "Gradedescription": "grade_description",
    "Cadredescription": "cadre_description",
    "Paymentdescription": "payment_description",
    "Attendancedescription": "attendance_description",
    "Workplacedescription": "workplace_description",
    "Band": "band",
    "Level": "level",
    "WorkCostCenter": "work_cost_center",
    "Custom Group 1": "custom_group_1",
    "Custom Group 2": "custom_group_2",
    "Custom Group 3": "custom_group_3",
    "Custom Group 4": "custom_group_4",
    "Custom Group 5": "custom_group_5",
    "PassportNumber": "passport_number",
    "PassportIssueDate": "passport_issue_date",
    "PassportValidUpto": "passport_valid_upto",
    "PassportIssuedcountry": "passport_issued_country",
    "VisaIssuingAuthority": "visa_issuing_authority",
    "VisaFromDate": "visa_from_date",
    "VisaUptoDate": "visa_upto_date",
    "AlreadyMemberInPF": "already_member_in_pf",
    "AlreadyMemberInPension": "already_member_in_pension",
    "WithdrawnPFandPension": "withdrawn_pf_and_pension",
    "InternationalWorkerStatus": "international_worker_status",
    "RelationshipForPF": "relationship_for_pf",
    "Qualification": "qualification",
    "DrivingLicenceNumber": "driving_licence_number",
    "DrivingLicenceValidDate": "driving_licence_valid_date",
    "PRANNumber": "pran_number",
    "Rehire": "rehire",
    "OldEmployeeID": "old_employee_id",
    "IsNonPayrollEmployee": "is_non_payroll_employee",
    "CategoryName": "category_name",
    "CustomMasterName": "custom_master_name",
    "CustomMasterName2": "custom_master_name2",
    "CustomMasterName3": "custom_master_name3",
    "OtEligibility": "ot_eligibility",
    "AutoShiftEligibility": "auto_shift_eligibility",
    "MobileUser": "mobile_user",
    "WebPunch": "web_punch",
    "AttendanceExceptionEligibility": "attendance_exception_eligibility",
    "AttendanceExceptionType": "attendance_exception_type"
  };

  // Form sections for better organization
  const formSections = {
    "Basic Information": [
      "Employee ID", "NamePrefix", "Employee Full Name", "GivenOrFirstName", 
      "MiddleName", "LastName", "Joining date", "PayrollStartingMonth", "DOB"
    ],
    "Identity Documents": [
      "Aadhar", "NameAsPerAadhar", "PAN", "NameAsPerPAN", "Gender"
    ],
    "Employment Details": [
      "Designationdescription", "Email", "AlternateEmail", "Departmentdescription", 
      "Work Location", "LabourStateDescription", "Employment Type", "Gradedescription",
      "Cadredescription", "Paymentdescription", "Attendancedescription", "Workplacedescription",
      "Band", "Level", "WorkCostCenter"
    ],
    "LWF Information": [
      "LWFDesignation", "LWFRelationship", "LWFID", "ProfessionaltaxgroupDescription",
      "PFComputationalGroup"
    ],
    "Contact Information": [
      "Mobile Number", "PhoneNumber1", "PhoneNumber2"
    ],
    "Address Information": [
      "Address1", "Address2", "Address3", "City", "State", "PinCode", "Country", "Nationality"
    ],
    "International Worker": [
      "IWNationality", "IWCity", "IWCountry", "COCIssuingAuthority", "COCIssueDate",
      "COCFromDate", "COCUptoDate"
    ],
    "Banking Information": [
      "BankName", "NameAsPerBank", "Accountno", "BankIFSCCode", "PaymentMode"
    ],
    "PF/ESI Information": [
      "PFaccountno", "ESIaccountno", "ESIAboveWageLimit", "UAN", "Branchdescription",
      "EnrollmentID", "ManagerEmployeeID", "Taxregime", "AlreadyMemberInPF",
      "AlreadyMemberInPension", "WithdrawnPFandPension", "InternationalWorkerStatus",
      "RelationshipForPF"
    ],
    "Family Information": [
      "Fathername", "MotherName", "SpouseName", "MaritalStatus", "NumberOfChildren"
    ],
    "Disability Information": [
      "DisabilityStatus", "TypeOfDisability"
    ],
    "Custom Groups": [
      "Custom Group 1", "Custom Group 2", "Custom Group 3", "Custom Group 4", "Custom Group 5"
    ],
    "Passport Information": [
      "PassportNumber", "PassportIssueDate", "PassportValidUpto", "PassportIssuedcountry"
    ],
    "Visa Information": [
      "VisaIssuingAuthority", "VisaFromDate", "VisaUptoDate"
    ],
    "Additional Information": [
      "Qualification", "DrivingLicenceNumber", "DrivingLicenceValidDate", "PRANNumber",
      "Rehire", "OldEmployeeID", "IsNonPayrollEmployee", "CategoryName",
      "CustomMasterName", "CustomMasterName2", "CustomMasterName3"
    ],
    "Eligibility Information": [
      "OtEligibility", "AutoShiftEligibility", "MobileUser", "WebPunch",
      "AttendanceExceptionEligibility", "AttendanceExceptionType"
    ]
  };

  useEffect(() => {
    fetchADPPayrollData();
  }, [employeeId]);

  const fetchADPPayrollData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/adp-payroll/employee/${employeeId}`);
      if (response.data.success && response.data.data) {
        setFormData(response.data.data);
        setIsDraft(response.data.isDraft);
      }
    } catch (error) {
      console.error("Error fetching ADP payroll data:", error);
      toast.error("Failed to fetch ADP payroll data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = async (isDraftSave = true) => {
    setSaving(true);
    try {
      const endpoint = isDraftSave ? 'draft' : '';
      const response = await axios.post(`/adp-payroll/employee/${employeeId}/${endpoint}`, formData);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setIsDraft(isDraftSave);
        if (!isDraftSave) {
          // Refresh data after finalizing
          await fetchADPPayrollData();
        }
      }
    } catch (error) {
      console.error("Error saving ADP payroll data:", error);
      toast.error("Failed to save ADP payroll data");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`/adp-payroll/employee/${employeeId}/finalize`);
      if (response.data.success) {
        toast.success(response.data.message);
        setIsDraft(false);
        await fetchADPPayrollData();
      }
    } catch (error) {
      console.error("Error finalizing ADP payroll data:", error);
      toast.error("Failed to finalize ADP payroll data");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field] || "";
    const isBoolean = ["ESIAboveWageLimit", "DisabilityStatus", "AlreadyMemberInPF", 
                      "AlreadyMemberInPension", "WithdrawnPFandPension", "InternationalWorkerStatus",
                      "Rehire", "IsNonPayrollEmployee", "OtEligibility", "AutoShiftEligibility",
                      "MobileUser", "WebPunch", "AttendanceExceptionEligibility"].includes(field);
    
    const isDate = ["Joining date", "PayrollStartingMonth", "DOB", "COCIssueDate", 
                   "COCFromDate", "COCUptoDate", "PassportIssueDate", "PassportValidUpto",
                   "VisaFromDate", "VisaUptoDate", "DrivingLicenceValidDate"].includes(field);
    
    const isSelect = ["Gender", "MaritalStatus", "PaymentMode", "Taxregime"].includes(field);

    if (isBoolean) {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value === "true")}
          disabled={isReadOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    if (isDate) {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    if (isSelect) {
      const options = {
        Gender: ["Male", "Female", "Other"],
        MaritalStatus: ["Single", "Married", "Divorced", "Widowed"],
        PaymentMode: ["Bank Transfer", "Cash", "Cheque"],
        Taxregime: ["Old", "New"]
      };

      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select {field}</option>
          {options[field]?.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(field, e.target.value)}
        disabled={isReadOnly}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={`Enter ${field}`}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-2xl text-blue-500" />
        <span className="ml-2">Loading ADP Payroll data...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">ADP Payroll Information</h3>
        <div className="flex items-center space-x-2">
          {isDraft && (
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              Draft
            </span>
          )}
          {!isDraft && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Finalized
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(formSections).map(([sectionName, fields]) => (
          <div key={sectionName} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => handleSectionToggle(sectionName)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
            >
              <span className="font-medium text-gray-700">{sectionName}</span>
              <span className="text-gray-500">
                {expandedSections[sectionName] ? "−" : "+"}
              </span>
            </button>
            
            {expandedSections[sectionName] && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(field => (
                  <div key={field} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isReadOnly && (
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
            Save Draft
          </button>
          
          {isDraft && (
            <button
              onClick={handleFinalize}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? <FaSpinner className="animate-spin mr-2" /> : <FaCheck className="mr-2" />}
              Finalize
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ADPPayrollForm;
