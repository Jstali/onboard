const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./config.env" });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOnboardingEmail(to, tempPassword) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Employee Onboarding Login Details",
    text: `Welcome to the company! \n\nLogin here: http://localhost:3000/login \nEmail: ${to} \nTemporary Password: ${tempPassword}\n\nPlease reset your password after logging in.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to the Company!</h2>
        <p>Your employee onboarding account has been created successfully.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Login Details</h3>
          <p><strong>Login URL:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Temporary Password:</strong> <span style="background-color: #fff; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${tempPassword}</span></p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Important:</strong> Please reset your password after your first login for security purposes.</p>
        </div>
        
        <p>If you have any questions, please contact the HR department.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to " + to);
    return true;
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    return false;
  }
}

async function sendPasswordResetEmail(to, resetToken) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Password Reset Request",
    text: `You requested a password reset. Click the link below to reset your password:\n\nhttp://localhost:3000/reset-password?token=${resetToken}\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3000/reset-password?token=${resetToken}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
          http://localhost:3000/reset-password?token=${resetToken}
        </p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent successfully to " + to);
    return true;
  } catch (err) {
    console.error("❌ Failed to send password reset email:", err);
    return false;
  }
}

async function sendLeaveRequestToManager(managerEmail, leaveRequest) {
  const mailOptions = {
    from: `"${leaveRequest.employeeName}" <${process.env.EMAIL_USER}>`,
    to: managerEmail,
    replyTo: leaveRequest.employeeEmail, // Set reply-to to employee's email
    subject: `Leave Request from ${leaveRequest.employeeName} - Action Required`,
    text: `Leave Request Details:\n\nEmployee: ${
      leaveRequest.employeeName
    }\nEmployee Email: ${leaveRequest.employeeEmail}\nLeave Type: ${
      leaveRequest.leaveType
    }\nFrom: ${leaveRequest.fromDate}\nTo: ${
      leaveRequest.toDate || "Single Day"
    }\nTotal Days: ${leaveRequest.totalDays}\nReason: ${
      leaveRequest.reason
    }\n\nPlease approve or reject this request by clicking the links below:\n\nApprove: http://localhost:5001/api/leave/approve/${
      leaveRequest.id
    }?action=approve&token=${
      leaveRequest.approvalToken
    }\nReject: http://localhost:5001/api/leave/approve/${
      leaveRequest.id
    }?action=reject&token=${leaveRequest.approvalToken}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Leave Request - Action Required</h2>
        <p>You have received a leave request that requires your approval.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Employee:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.employeeName
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Employee Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.employeeEmail
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Leave Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.leaveType
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>From Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.fromDate
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>To Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.toDate || "Single Day"
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Total Days:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.totalDays
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Reason:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.reason
            }</td></tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:5001/api/leave/approve/${
            leaveRequest.id
          }?action=approve&token=${leaveRequest.approvalToken}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 15px;">
            ✅ Approve Request
          </a>
          <a href="http://localhost:5001/api/leave/approve/${
            leaveRequest.id
          }?action=reject&token=${leaveRequest.approvalToken}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ❌ Reject Request
          </a>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Note:</strong> Clicking the buttons above will automatically approve or reject this leave request. You can also copy and paste the URLs into your browser.</p>
        </div>
        
        <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0066cc;"><strong>Reply:</strong> You can reply to this email to communicate directly with ${
            leaveRequest.employeeName
          } at ${leaveRequest.employeeEmail}</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. You can reply to communicate with the employee.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Leave request email sent to manager: " + managerEmail);
    return true;
  } catch (err) {
    console.error("❌ Failed to send leave request email to manager:", err);
    return false;
  }
}

async function sendManagerApprovalToHR(hrEmail, leaveRequest, managerName) {
  const mailOptions = {
    from: `"${managerName} (Manager)" <${process.env.EMAIL_USER}>`,
    to: hrEmail,
    replyTo: leaveRequest.employeeEmail, // Set reply-to to employee's email
    subject: `Leave Request Approved by Manager - HR Action Required`,
    text: `Leave Request Details:\n\nEmployee: ${
      leaveRequest.employeeName
    }\nEmployee Email: ${leaveRequest.employeeEmail}\nLeave Type: ${
      leaveRequest.leaveType
    }\nFrom: ${leaveRequest.fromDate}\nTo: ${
      leaveRequest.toDate || "Single Day"
    }\nTotal Days: ${leaveRequest.totalDays}\nReason: ${
      leaveRequest.reason
    }\nManager: ${managerName}\nStatus: Manager Approved\n\nPlease review and approve/reject this request in the Leave Management system.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Leave Request - Manager Approved</h2>
        <p>A leave request has been approved by a manager and now requires HR review.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Employee:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.employeeName
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Employee Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.employeeEmail
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Leave Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.leaveType
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>From Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.fromDate
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>To Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.toDate || "Single Day"
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Total Days:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.totalDays
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Reason:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.reason
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Manager:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${managerName}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><span style="color: #28a745; font-weight: bold;">✅ Manager Approved</span></td></tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3001/hr/leave-management" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            📋 Review in Leave Management
          </a>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Action Required:</strong> Please review this request in the Leave Management system and approve or reject it.</p>
        </div>
        
        <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0066cc;"><strong>Reply:</strong> You can reply to this email to communicate directly with ${
            leaveRequest.employeeName
          } at ${leaveRequest.employeeEmail}</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. You can reply to communicate with the employee.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Manager approval notification sent to HR: " + hrEmail);
    return true;
  } catch (err) {
    console.error(
      "❌ Failed to send manager approval notification to HR:",
      err
    );
    return false;
  }
}

async function sendLeaveApprovalToEmployee(
  employeeEmail,
  leaveRequest,
  status,
  approverName
) {
  const mailOptions = {
    from: `"${approverName} (${
      status === "approved" ? "Approver" : "Reviewer"
    })" <${process.env.EMAIL_USER}>`,
    to: employeeEmail,
    replyTo: process.env.EMAIL_USER, // Set reply-to to company email for HR inquiries
    subject: `Leave Request ${status === "approved" ? "Approved" : "Rejected"}`,
    text: `Your leave request has been ${status}.\n\nDetails:\nLeave Type: ${
      leaveRequest.leaveType
    }\nFrom: ${leaveRequest.fromDate}\nTo: ${
      leaveRequest.toDate || "Single Day"
    }\nTotal Days: ${leaveRequest.totalDays}\nReason: ${
      leaveRequest.reason
    }\nStatus: ${status.toUpperCase()}\nApproved by: ${approverName}\n\nIf you have any questions, please contact HR.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Leave Request ${
          status === "approved" ? "Approved" : "Rejected"
        }</h2>
        <p>Your leave request has been <strong>${status}</strong> by ${approverName}.</p>
        
        <div style="background-color: ${
          status === "approved" ? "#d4edda" : "#f8d7da"
        }; border: 1px solid ${
      status === "approved" ? "#c3e6cb" : "#f5c6cb"
    }; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${
            status === "approved" ? "#155724" : "#721c24"
          }; margin-top: 0;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Leave Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.leaveType
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>From Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.fromDate
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>To Date:</strong></td><td style="padding: 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.toDate || "Single Day"
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Total Days:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.totalDays
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Reason:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${
              leaveRequest.reason
            }</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><span style="color: ${
              status === "approved" ? "#155724" : "#721c24"
            }; font-weight: bold;">${status.toUpperCase()}</span></td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Approved by:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${approverName}</td></tr>
          </table>
        </div>
        
        ${
          status === "approved"
            ? `
        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0c5460;"><strong>✅ Approved!</strong> Your leave has been approved and will be deducted from your leave balance.</p>
        </div>
        `
            : `
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;"><strong>❌ Rejected!</strong> Your leave request has been rejected. Please contact your manager or HR for more details.</p>
        </div>
        `
        }
        
        <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0066cc;"><strong>Contact:</strong> If you have questions about this decision, please contact HR or reply to this email.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. You can reply for HR inquiries.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      "✅ Leave approval notification sent to employee: " + employeeEmail
    );
    return true;
  } catch (err) {
    console.error(
      "❌ Failed to send leave approval notification to employee:",
      err
    );
    return false;
  }
}

module.exports = {
  sendOnboardingEmail,
  sendPasswordResetEmail,
  sendLeaveRequestToManager,
  sendManagerApprovalToHR,
  sendLeaveApprovalToEmployee,
};
