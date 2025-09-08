import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSignOutAlt,
  FaBuilding,
  FaUsers,
  FaClock,
  FaShieldAlt,
  FaHandshake,
  FaGraduationCap,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const CompanyPolicies = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const policies = [
    {
      id: 1,
      title: "Company Overview",
      icon: <FaBuilding className="w-6 h-6 text-deep-space-black" />,
      content: `NXZEN is a leading technology company dedicated to innovation and excellence in software development and digital solutions. Founded on the principles of creativity, collaboration, and cutting-edge technology, we strive to deliver exceptional results that exceed our clients' expectations.

Our mission is to transform businesses through innovative technology solutions while maintaining the highest standards of professional integrity and customer satisfaction. We believe in fostering a collaborative work environment where every team member can thrive and contribute to our collective success.`,
    },
    {
      id: 2,
      title: "Code of Conduct",
      icon: <FaHandshake className="w-6 h-6 text-lumen-green" />,
      content: `At NXZEN, we maintain the highest ethical standards in all our business dealings. All employees are expected to:

• Treat colleagues, clients, and partners with respect and professionalism
• Maintain confidentiality of sensitive company and client information
• Act with honesty and integrity in all business transactions
• Avoid conflicts of interest and report any potential conflicts immediately
• Comply with all applicable laws, regulations, and company policies
• Represent the company positively in all professional interactions`,
    },
    {
      id: 3,
      title: "Work Environment & Culture",
      icon: <FaUsers className="w-6 h-6 text-neon-violet" />,
      content: `NXZEN is committed to providing a positive, inclusive, and productive work environment where all employees can succeed. Our culture is built on:

• Collaboration and teamwork across all departments
• Open communication and feedback
• Innovation and creative problem-solving
• Continuous learning and professional development
• Work-life balance and employee well-being
• Diversity, equity, and inclusion in all aspects of our business
• Recognition and celebration of achievements and milestones`,
    },
    {
      id: 4,
      title: "Attendance & Time Management",
      icon: <FaClock className="w-6 h-6 text-brand-coral" />,
      content: `Punctuality and regular attendance are essential for maintaining our high standards of client service and team collaboration:

• Standard working hours: 9:00 AM to 6:00 PM, Monday through Friday
• Flexible working arrangements available with manager approval
• Remote work options available for eligible positions
• All absences must be reported and approved in advance through our attendance system
• Sick leave should be reported as early as possible
• Time tracking is required for all billable and project work
• Break times: 1 hour lunch break and two 15-minute breaks per day`,
    },
    {
      id: 5,
      title: "Information Security",
      icon: <FaShieldAlt className="w-6 h-6 text-deep-space-black" />,
      content: `Protecting company and client data is paramount to our success and reputation:

• All company devices must be password protected and encrypted
• Use strong, unique passwords for all systems and applications
• Never share login credentials or access cards with others
• Report any security incidents or suspicious activities immediately
• Client data must be handled according to confidentiality agreements
• Personal use of company equipment should be limited and appropriate
• Regular security training is mandatory for all employees
• Two-factor authentication is required for all critical systems`,
    },
    {
      id: 6,
      title: "Professional Development",
      icon: <FaGraduationCap className="w-6 h-6 text-lumen-green" />,
      content: `NXZEN invests in our employees' growth and career advancement:

• Annual performance reviews and goal setting
• Professional development budget available for training and certifications
• Internal mentorship programs and knowledge sharing sessions
• Conference attendance and industry event participation opportunities
• Cross-training opportunities to expand skill sets
• Leadership development programs for career advancement
• Regular feedback and coaching from supervisors
• Recognition programs for outstanding performance and innovation`,
    },
  ];

  return (
    <div className="min-h-screen bg-iridescent-pearl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-deep-space-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-deep-space-black/70 hover:text-deep-space-black hover:bg-neon-violet/20 transition-all duration-200 mr-4 px-3 py-2 rounded-lg"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="brand-heading-md text-deep-space-black">
                  Company Policies
                </h1>
                <p className="brand-body-sm text-deep-space-black/70">
                  NXZEN Employee Handbook & Guidelines
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-deep-space-black bg-lumen-green hover:bg-neon-violet rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm border border-deep-space-black/10 p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-lumen-green/20 rounded-full flex items-center justify-center">
                <FaBuilding className="w-6 h-6 text-deep-space-black" />
              </div>
            </div>
            <div className="ml-4">
              <h2 className="brand-subheading-lg text-deep-space-black">
                Welcome to NXZEN
              </h2>
              <p className="brand-body-md text-deep-space-black/70">
                Your guide to our company policies, procedures, and culture
              </p>
            </div>
          </div>
          <p className="text-deep-space-black/80 leading-relaxed">
            This handbook serves as your comprehensive guide to working at NXZEN. 
            Please familiarize yourself with all policies and procedures outlined 
            below. If you have any questions, don't hesitate to reach out to your 
            manager or the HR department.
          </p>
        </div>

        {/* Policies Grid */}
        <div className="space-y-6">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white rounded-lg shadow-sm border border-deep-space-black/10 hover:shadow-md hover:border-neon-violet/30 transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 mr-4">
                    {policy.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-deep-space-black">
                    {policy.title}
                  </h3>
                </div>
                <div className="prose prose-gray max-w-none">
                  <p className="text-deep-space-black/80 leading-relaxed whitespace-pre-line">
                    {policy.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 bg-lumen-green/10 rounded-lg p-6 border border-lumen-green/20">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-deep-space-black mb-2">
              Questions or Concerns?
            </h3>
            <p className="text-deep-space-black/70 mb-4">
              If you have any questions about these policies or need clarification 
              on any company procedures, please contact:
            </p>
            <div className="space-y-2 text-sm text-deep-space-black/80">
              <p><strong>HR Department:</strong> hr@nxzen.com</p>
              <p><strong>General Inquiries:</strong> info@nxzen.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyPolicies;
