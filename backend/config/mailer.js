const nodemailer = require("nodemailer");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const hasValidConfig = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  return (
    host &&
    host !== "yourdomain.ip-zone.com" &&
    user &&
    user !== "your_mailrelay_username"
  );
};

// Create SMTP transporter if config is valid
let transporter = null;
if (hasValidConfig()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify configuration
  transporter.verify((error, success) => {
    if (error) {
      console.warn("⚠️ Mailrelay SMTP verification failed:", error.message);
    } else {
      console.log("✅ Mailrelay SMTP connection established successfully!");
    }
  });
} else {
  console.warn(
    "⚠️ Mailrelay SMTP credentials are using placeholder values. Emails will be logged to console instead of sent."
  );
}

const sendEmail = async ({ to, subject, html }) => {
  if (!hasValidConfig()) {
    console.log(
      `\n--- [SMTP MOCK LOG] ---\nTo: ${to}\nSubject: ${subject}\nBody: ${html}\n-----------------------\n`
    );
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Naksh Foundation" <info@naksh.org>',
      to,
      subject,
      html,
    });
    console.log("Email sent successfully: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending SMTP email:", error);
    return false;
  }
};

const mailer = {
  // 1. Proposal Raised (Notify admin & proposer)
  sendProposalRaisedAlert: async (proposal) => {
    // Alert Admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || "admin@projectdelhi.org",
      subject: `New Proposal Submitted: ${proposal.title}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #8c2424; margin-top: 0;">New Proposal Pending Review</h2>
          <p>A new campaign proposal has been submitted on Project Delhi and is pending review.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p><strong>Title:</strong> ${proposal.title}</p>
          <p><strong>Category:</strong> ${proposal.category}</p>
          <p><strong>Proposer:</strong> ${proposal.applicantName} (${proposal.email})</p>
          <p><strong>Contact:</strong> ${proposal.phone}</p>
          <p><strong>Address:</strong> ${proposal.address}, ${proposal.locality}, ${proposal.city} - ${proposal.pincode}</p>
          <p><strong>Volunteers Needed:</strong> ${proposal.volunteersNeeded}</p>
          <p><strong>Scheduled Event:</strong> ${proposal.eventDate} at ${proposal.eventTime}</p>
          <p><strong>Description:</strong><br>${proposal.description}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p><a href="${CLIENT_URL}/volunteer-dashboard" style="background-color: #8c2424; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Review Proposal</a></p>
        </div>
      `,
    });

    // Send confirmation to proposer
    return sendEmail({
      to: proposal.email,
      subject: `Proposal Received - Project Delhi`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2e7d32; margin-top: 0;">We Received Your Proposal</h2>
          <p>Dear ${proposal.applicantName},</p>
          <p>Thank you for submitting your proposal <strong>"${proposal.title}"</strong> to Project Delhi. Our team of moderators will review your campaign details shortly.</p>
          <p>You will receive email notifications as the status of your proposal changes or if moderators ask for any clarifications.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 2. Info Asked by Moderator (Send to Proposer)
  sendInfoRequestedNotice: async (userEmail, applicantName, proposalTitle, query) => {
    return sendEmail({
      to: userEmail,
      subject: `Information Requested: ${proposalTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f57c00; margin-top: 0;">Clarification Needed for Your Proposal</h2>
          <p>Dear ${applicantName},</p>
          <p>A moderator has requested additional details or changes for your campaign proposal <strong>"${proposalTitle}"</strong>:</p>
          <div style="background-color: #fff3e0; border-left: 4px solid #f57c00; padding: 12px 18px; font-style: italic; border-radius: 4px; margin: 20px 0;">
            "${query}"
          </div>
          <p>Please log into your dashboard on Project Delhi, click on the proposal, and provide your response to proceed with the approval process.</p>
          <p><a href="${CLIENT_URL}/dashboard" style="background-color: #f57c00; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Respond to Request</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 3. Proposal Approved / Goes Live (Send to Proposer)
  sendProposalApprovedNotice: async (userEmail, applicantName, proposalTitle) => {
    return sendEmail({
      to: userEmail,
      subject: `Your Proposal is Live - Project Delhi`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2e7d32; margin-top: 0;">Your Proposal Has Been Approved</h2>
          <p>Dear ${applicantName},</p>
          <p>Great news! Your campaign proposal <strong>"${proposalTitle}"</strong> has been approved and is now officially live on the Project Delhi site.</p>
          <p>Volunteers across Delhi can now browse, read about, and register to volunteer for your campaign.</p>
          <p><a href="${CLIENT_URL}/browse" style="background-color: #2e7d32; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Explore Campaigns</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Thank you for contributing to our community,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 4. Subscribed for Updates (Send to Subscriber)
  sendSubscriptionWelcome: async (subscriberEmail) => {
    return sendEmail({
      to: subscriberEmail,
      subject: `Welcome to Project Delhi Updates`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #8c2424; margin-top: 0;">Thanks for Subscribing</h2>
          <p>Hello,</p>
          <p>You have successfully subscribed to newsletter updates from <strong>projectdelhi.org</strong>, a cyber safety and community initiative by Naksh Foundation.</p>
          <p>We'll keep you posted about upcoming community cleanups, cyber awareness drives, new campaigns, and progress reports.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Naksh Foundation Team</strong></p>
        </div>
      `,
    });
  },

  // 5. General Volunteer Registered (Send to Volunteer & Admin)
  sendGeneralVolunteerWelcome: async (volunteer) => {
    // Notify Volunteer
    await sendEmail({
      to: volunteer.email,
      subject: `Welcome to the Project Delhi Volunteer Pool`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #8c2424; margin-top: 0;">Welcome to the Team, ${volunteer.name}</h2>
          <p>Thank you for joining our general volunteer pool. Your details are now registered in our database.</p>
          <p>Whenever we organize cleanup drives, educational events, or cyber awareness programs in Delhi that match your preferred role (<strong>${volunteer.preferredRole}</strong>), we will reach out to you.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p><strong>Your Profile:</strong></p>
          <ul>
            <li><strong>Preferred Role:</strong> ${volunteer.preferredRole}</li>
            <li><strong>Location:</strong> ${volunteer.location}</li>
            <li><strong>Phone:</strong> ${volunteer.phone}</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Warm regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });

    // Alert Admin
    return sendEmail({
      to: process.env.ADMIN_EMAIL || "admin@projectdelhi.org",
      subject: `New Volunteer Registered: ${volunteer.name}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0;">New Volunteer Added to Pool</h3>
          <p><strong>Name:</strong> ${volunteer.name}</p>
          <p><strong>Email:</strong> ${volunteer.email}</p>
          <p><strong>Phone:</strong> ${volunteer.phone}</p>
          <p><strong>Preferred Role:</strong> ${volunteer.preferredRole}</p>
          <p><strong>Location:</strong> ${volunteer.location}</p>
        </div>
      `,
    });
  },

  // 6. Volunteer Application Received (Specific Task)
  sendVolunteerAppReceived: async (appRecord, taskTitle) => {
    // Notify Volunteer
    await sendEmail({
      to: appRecord.email,
      subject: `Volunteering Application Received - ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f57c00; margin-top: 0;">Application Received</h2>
          <p>Dear ${appRecord.name},</p>
          <p>Your application to volunteer for the campaign <strong>"${taskTitle}"</strong> has been successfully received.</p>
          <p>Our moderators and the campaign organizer will review your details shortly. You will get another email notification as soon as a decision is made.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });

    // Alert Admin / Moderator
    return sendEmail({
      to: process.env.ADMIN_EMAIL || "admin@projectdelhi.org",
      subject: `New Volunteering Application for ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0;">New Application for Campaign</h3>
          <p><strong>Campaign:</strong> ${taskTitle}</p>
          <p><strong>Applicant Name:</strong> ${appRecord.name}</p>
          <p><strong>Email:</strong> ${appRecord.email}</p>
          <p><strong>Phone:</strong> ${appRecord.phone}</p>
          <p><strong>Reason/Experience:</strong><br>${appRecord.reason}</p>
          <p><a href="${CLIENT_URL}/volunteer-dashboard">Go to Moderator Dashboard</a> to review.</p>
        </div>
      `,
    });
  },

  // 7. Volunteer Application Status Updated (Approved/Rejected)
  sendVolunteerAppStatusUpdate: async (appRecord, taskTitle, status, reason) => {
    const isApproved = status === "approved";
    const statusColor = isApproved ? "#2e7d32" : "#c62828";
    const statusText = isApproved ? "Approved" : "Declined";

    return sendEmail({
      to: appRecord.email,
      subject: `Update on Volunteer Application - ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: ${statusColor}; margin-top: 0;">Application Status: ${statusText}</h2>
          <p>Dear ${appRecord.name},</p>
          <p>Your volunteering application for the campaign <strong>"${taskTitle}"</strong> has been reviewed.</p>
          ${
            isApproved
              ? `<p><strong>Congratulations! Your application has been approved.</strong> The campaign organizer will get in touch with you shortly via phone or email with instructions for the event day.</p>`
              : `<p>We regret to inform you that your application has been declined at this time.</p>
                 <p><strong>Reason for decision:</strong></p>
                 <div style="background-color: #ffebee; border-left: 4px solid #c62828; padding: 12px 18px; font-style: italic; border-radius: 4px; margin: 20px 0;">
                   "${reason || "Slots are fully filled."}"
                 </div>
                 <p>We encourage you to apply for other campaigns on our platform.</p>`
          }
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Thank you for your support,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 8. Donation Receipt (Send to Donor)
  sendDonationReceipt: async (donorEmail, donorName, donationDetails) => {
    return sendEmail({
      to: donorEmail,
      subject: `Thank You for Your Support - Naksh Foundation`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #8c2424; margin-top: 0;">Donation Acknowledgment</h2>
          <p>Dear ${donorName},</p>
          <p>Thank you for your generous donation of <strong>INR ${donationDetails.amount}</strong> to Naksh Foundation.</p>
          <p>Your contribution directly supports our community cleanups, cyber awareness programs, and education kits for under-resourced children in Delhi.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p><strong>Donation Receipt Details:</strong></p>
          <ul>
            <li><strong>Donor Name:</strong> ${donorName}</li>
            <li><strong>Amount Paid:</strong> INR ${donationDetails.amount}</li>
            <li><strong>Transaction Reference:</strong> ${donationDetails.txId || "N/A"}</li>
            <li><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</li>
          </ul>
          <p style="font-size: 0.85rem; color: #666; font-style: italic;">Note: Your donation is tax-exempt under Section 80G of the Indian Income Tax Act. A formal receipt certificate will be sent to your address.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>With deep gratitude,<br><strong>Naksh Foundation</strong><br>Project CyberShield / Project Delhi</p>
        </div>
      `,
    });
  },

  // 9. Donation Report Acknowledgement (Send to Donor)
  sendDonationReportAcknowledgement: async (donorEmail, donorName, amount, method, txId) => {
    return sendEmail({
      to: donorEmail,
      subject: `Donation Report Received - Naksh Foundation`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #8c2424; margin-top: 0;">Donation Report Received</h2>
          <p>Dear ${donorName},</p>
          <p>We have successfully received the payment details you submitted for your manual donation of <strong>INR ${amount}</strong> via ${method.toUpperCase()}.</p>
          <p>Our team is currently verifying the transfer with reference transaction ID: <strong>${txId}</strong>. Once verified, your tax-exempt 80G receipt will be sent to this email address within 24 hours.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>If you have any questions or made an error in the details, please reply to this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Thank you for supporting our community initiative,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 9. General Partner Registered (Send to Partner & Admin)
  sendGeneralPartnerWelcome: async (partner) => {
    // Notify Partner
    await sendEmail({
      to: partner.email,
      subject: `Welcome to the Project Delhi Partner Directory`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #8c2424; margin-top: 0;">Thank you for registering, ${partner.contactName}</h2>
          <p>We are thrilled to receive your expression of interest to partner with Project Delhi. Your organization details have been saved in our directory.</p>
          ${partner.taskTitle ? `<p>Your proposal to collaborate on the event <strong>${partner.taskTitle}</strong> has been submitted to the coordinators for review.</p>` : `<p>We will contact you with collaboration opportunities for our upcoming campaigns and initiatives.</p>`}
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p><strong>Organization Profile:</strong></p>
          <ul>
            <li><strong>Organization Name:</strong> ${partner.orgName}</li>
            <li><strong>Type:</strong> ${partner.orgType}</li>
            <li><strong>Designation:</strong> ${partner.designation}</li>
            <li><strong>Location:</strong> ${partner.location}</li>
            <li><strong>Phone:</strong> ${partner.phone}</li>
            <li><strong>Collab Reason:</strong> ${partner.collabReason}</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Warm regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });

    // Alert Admin
    return sendEmail({
      to: process.env.ADMIN_EMAIL || "admin@projectdelhi.org",
      subject: `New Organization Registered: ${partner.orgName}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0;">New Organization Added to Pool</h3>
          <p><strong>Org Name:</strong> ${partner.orgName}</p>
          <p><strong>Type:</strong> ${partner.orgType}</p>
          <p><strong>Contact Person:</strong> ${partner.contactName} (${partner.designation})</p>
          <p><strong>Email:</strong> ${partner.email}</p>
          <p><strong>Phone:</strong> ${partner.phone}</p>
          <p><strong>Location:</strong> ${partner.location}</p>
          <p><strong>Collab Proposal:</strong> ${partner.collabReason}</p>
          ${partner.taskTitle ? `<p><strong>Applied for Event:</strong> ${partner.taskTitle} (${partner.taskId})</p>` : ""}
        </div>
      `,
    });
  },

  // 10. Password Reset Email (Send to User)
  sendPasswordResetEmail: async (email, name, resetLink) => {
    return sendEmail({
      to: email,
      subject: `Reset Your Password - Project Delhi`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; border-radius: 12px; background-color: #FAF8F5;">
          <h2 style="color: #8c2424; margin-top: 0; font-size: 1.5rem; font-weight: bold; border-bottom: 2px solid #8c2424; padding-bottom: 10px;">Password Reset Request</h2>
          <p>Dear ${name},</p>
          <p>We received a request to reset the password for your account on Project Delhi. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, please click the button below. This link will expire in 1 hour:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #8c2424; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 10px rgba(140, 36, 36, 0.2);">Reset Password</a>
          </div>
          <p style="font-size: 0.9rem; color: #666;">If the button above doesn't work, copy and paste the following URL into your web browser:</p>
          <p style="word-break: break-all; font-size: 0.85rem; color: #8c2424;"><a href="${resetLink}">${resetLink}</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.85rem; color: #888;">Thank you,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 11. Proposal Deleted/Cancelled notice
  sendProposalDeletedNotice: async (userEmail, applicantName, proposalTitle, reason, deletedBy) => {
    return sendEmail({
      to: userEmail,
      subject: `Proposal Cancelled: ${proposalTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #c62828; margin-top: 0;">Proposal Cancelled & Deleted</h2>
          <p>Dear ${applicantName},</p>
          <p>Your campaign proposal <strong>"${proposalTitle}"</strong> has been cancelled and deleted from Project Delhi by ${deletedBy}.</p>
          <p><strong>Reason for cancellation:</strong></p>
          <div style="background-color: #ffebee; border-left: 4px solid #c62828; padding: 12px 18px; font-style: italic; border-radius: 4px; margin: 20px 0;">
            "${reason}"
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 12. Proposal Edited notice
  sendProposalEditedNotice: async (userEmail, applicantName, proposalTitle) => {
    return sendEmail({
      to: userEmail,
      subject: `Proposal Updated - Project Delhi`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2e7d32; margin-top: 0;">Proposal Edits Received</h2>
          <p>Dear ${applicantName},</p>
          <p>Your proposal <strong>"${proposalTitle}"</strong> has been successfully updated with your recent edits.</p>
          <p>Our coordinators/moderators will review the updated campaign details shortly.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 13. Proposal Query Raised notice
  sendProposalQueryRaisedNotice: async (userEmail, applicantName, proposalTitle, action, reason) => {
    const actionText = action === "delete" ? "Delete / Cancel" : "Edit Details";
    return sendEmail({
      to: userEmail,
      subject: `Revision Query Received: ${proposalTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f57c00; margin-top: 0;">Revision Query Received</h2>
          <p>Dear ${applicantName},</p>
          <p>We have successfully received your query requesting to <strong>${actionText}</strong> your live/verified proposal <strong>"${proposalTitle}"</strong>.</p>
          <p><strong>Reason provided for request:</strong></p>
          <div style="background-color: #fff3e0; border-left: 4px solid #f57c00; padding: 12px 18px; font-style: italic; border-radius: 4px; margin: 20px 0;">
            "${reason}"
          </div>
          <p>A coordinator/moderator will review your request shortly. You will be notified by email once actions are taken.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 14. Proposal Allow Edit permission notice
  sendProposalAllowEditNotice: async (userEmail, applicantName, proposalTitle) => {
    return sendEmail({
      to: userEmail,
      subject: `Edit Permission Granted: ${proposalTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2e7d32; margin-top: 0;">Edit Permission Granted</h2>
          <p>Dear ${applicantName},</p>
          <p>An admin/moderator has reviewed your query and granted edit permissions for your proposal <strong>"${proposalTitle}"</strong>.</p>
          <p>The "Edit" button is now active on your proposer dashboard. Please log in and submit your revisions.</p>
          <p style="margin-top: 24px;"><a href="${CLIENT_URL}/dashboard" style="background-color: #2e7d32; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Go to Dashboard</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 15. Volunteer application slot cancellation notice
  sendVolunteerWithdrawNotice: async (userEmail, name, taskTitle, reason) => {
    return sendEmail({
      to: userEmail,
      subject: `Volunteering Slot Cancelled: ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #c62828; margin-top: 0;">Volunteering Slot Cancelled</h2>
          <p>Dear ${name},</p>
          <p>We are writing to confirm that you have successfully withdrawn your volunteering request / cancelled your slot for the campaign event <strong>"${taskTitle}"</strong>.</p>
          <p><strong>Reason for cancellation:</strong></p>
          <div style="background-color: #ffebee; border-left: 4px solid #c62828; padding: 12px 18px; font-style: italic; border-radius: 4px; margin: 20px 0;">
            "${reason || "Withdrawn by volunteer"}"
          </div>
          <p>If this was done by mistake, you can always go back to the Project Delhi platform and sign up again.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },

  // 16. Proposal Rejected (Send to Proposer)
  sendProposalRejectedNotice: async (userEmail, applicantName, proposalTitle, reason) => {
    return sendEmail({
      to: userEmail,
      subject: `Proposal Declined - Project Delhi`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #c62828; margin-top: 0;">Proposal Update: Declined</h2>
          <p>Dear ${applicantName},</p>
          <p>Thank you for submitting your campaign proposal <strong>"${proposalTitle}"</strong> to Project Delhi.</p>
          <p>After reviewing the details, we regret to inform you that your proposal has been declined at this time.</p>
          <p><strong>Reason for rejection:</strong></p>
          <div style="background-color: #ffebee; border-left: 4px solid #c62828; padding: 12px 18px; font-style: italic; border-radius: 4px; margin: 20px 0;">
            "${reason}"
          </div>
          <p>If you have any questions or would like to submit a revised proposal, please do not hesitate to contact us.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Best regards,<br><strong>Project Delhi Team</strong><br>Naksh Foundation</p>
        </div>
      `,
    });
  },
};

module.exports = mailer;
