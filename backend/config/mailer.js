const nodemailer = require("nodemailer");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const hasValidConfig = () => {
  if (process.env.RESEND_API_KEY) return true;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  return (
    host &&
    host !== "yourdomain.ip-zone.com" &&
    user &&
    user !== "your_mailrelay_username"
  );
};

// Create SMTP transporter if config is valid (only if Resend API Key is not set)
let transporter = null;
if (!process.env.RESEND_API_KEY && hasValidConfig()) {
  transporter = nodemailer.createTransport({
    pool: true,
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
} else if (process.env.RESEND_API_KEY) {
  console.log("✅ Resend API configured successfully for email delivery!");
} else {
  console.warn(
    "⚠️ Mailer credentials are using placeholder values. Emails will be logged to console instead of sent."
  );
}

const sendEmail = async ({ to, subject, html }) => {
  // Prevent sending administrative alert emails if disabled in config (defaults to disabled unless explicitly set to 'false')
  const adminEmail = (process.env.ADMIN_EMAIL || "hello@projectdelhi.org").toLowerCase();
  const recipient = to.toLowerCase();
  const shouldDisable = process.env.DISABLE_ADMIN_ALERTS !== "false";

  if (
    shouldDisable &&
    (recipient.includes(adminEmail) ||
      recipient.includes("hello@projectdelhi.org") ||
      recipient.includes("admin@projectdelhi.org") ||
      recipient.includes("team@projectdelhi.org"))
  ) {
    console.log(`[MAILER] Admin alert to ${to} skipped (disabled by default or configuration): "${subject}"`);
    return true;
  }

  if (!hasValidConfig()) {
    console.log(
      `\n--- [MAILER MOCK LOG] ---\nTo: ${to}\nSubject: ${subject}\nBody: ${html}\n-----------------------\n`
    );
    return true;
  }

  // If Resend API Key is present, send email via Resend's HTTPS REST API
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || '"Naksh Foundation" <info@naksh.org>',
          to: [to],
          subject,
          html,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Email sent successfully via Resend API: %s", data.id);
        return true;
      } else {
        console.error("Resend API returned error:", data);
        return false;
      }
    } catch (error) {
      console.error("Error sending email via Resend API:", error);
      return false;
    }
  }

  // Otherwise, fall back to Nodemailer SMTP
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Naksh Foundation" <info@naksh.org>',
      to,
      subject,
      html,
    });
    console.log("Email sent successfully via SMTP: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending SMTP email:", error);
    return false;
  }
};

/**
 * Generates a unified, premium HTML email wrapper using responsive tables and inline styles.
 */
const getHtmlTemplate = ({
  title,
  preheader = "Project Delhi Update",
  themeColor = "#8c2424", // Naksh Burgundy
  contentHtml,
  button = null, // { label, url, color }
  callout = null, // { text, type: 'info' | 'success' | 'warning' | 'danger' }
  details = null, // Array of { label, value }
}) => {
  // Determine callout colors
  let calloutBg = "#F8FAFC";
  let calloutBorder = "#E2E8F0";
  if (callout) {
    switch (callout.type) {
      case "success":
        calloutBg = "#F0FDF4";
        calloutBorder = "#16A34A";
        break;
      case "warning":
        calloutBg = "#FFFBEB";
        calloutBorder = "#D97706";
        break;
      case "danger":
        calloutBg = "#FEF2F2";
        calloutBorder = "#DC2626";
        break;
      case "info":
      default:
        calloutBg = "#EFF6FF";
        calloutBorder = "#2563EB";
        break;
    }
  }

  // Generate details HTML
  let detailsHtml = "";
  if (details && details.length > 0) {
    detailsHtml = `
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          ${details
            .map(
              (item) => `
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748B; font-weight: 600; width: 35%; vertical-align: top;">${item.label}</td>
              <td style="padding: 6px 0; font-size: 14px; color: #1E293B; width: 65%; vertical-align: top;">${item.value}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>
    `;
  }

  // Generate button HTML
  let buttonHtml = "";
  if (button && button.url) {
    const btnColor = button.color || themeColor;
    buttonHtml = `
      <div style="text-align: center; margin: 32px 0;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${button.url}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" stroke="f" fillcolor="${btnColor}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${button.label}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${button.url}" style="background-color: ${btnColor}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
          ${button.label}
        </a>
        <!--<![endif]-->
      </div>
    `;
  }

  // Generate callout HTML
  let calloutHtml = "";
  if (callout && callout.text) {
    calloutHtml = `
      <div style="background-color: ${calloutBg}; border-left: 4px solid ${calloutBorder}; padding: 16px 20px; border-radius: 6px; margin: 24px 0; color: #1E293B; font-size: 15px; line-height: 1.6;">
        ${callout.text}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>${title}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          margin: 0;
          padding: 0;
          width: 100% !important;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
      </style>
    </head>
    <body style="background-color: #F8FAFC; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; margin: 0; padding: 0;">
      <span style="display: none; max-height: 0px; overflow: hidden;">
        ${preheader}
      </span>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 24px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
              <!-- Top decorative accent line -->
              <tr>
                <td height="4" style="background-color: ${themeColor}; line-height: 4px; font-size: 0;">&nbsp;</td>
              </tr>
              <!-- Brand Header -->
              <tr>
                <td style="padding: 32px 32px 16px 32px; text-align: left;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: ${themeColor}; text-transform: uppercase; display: block; margin-bottom: 4px;">Project Delhi</span>
                        <span style="font-size: 13px; color: #64748B; font-weight: 500;">Naksh Foundation Initiative</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Main Divider -->
              <tr>
                <td style="padding: 0 32px;">
                  <hr style="border: 0; border-top: 1px solid #F1F5F9; margin: 0;">
                </td>
              </tr>
              <!-- Email Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px; font-size: 15px; line-height: 1.625; color: #334155;">
                  <h2 style="font-size: 20px; font-weight: 700; color: #1E293B; margin-top: 0; margin-bottom: 16px; line-height: 1.3;">
                    ${title}
                  </h2>
                  ${contentHtml}
                  ${calloutHtml}
                  ${detailsHtml}
                  ${buttonHtml}
                </td>
              </tr>
              <!-- Footer Section -->
              <tr>
                <td style="padding: 0 32px 32px 32px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #F1F5F9; padding-top: 24px; text-align: center;">
                    <tr>
                      <td style="font-size: 12px; color: #64748B; line-height: 1.6;">
                        <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">Project Delhi &bull; Naksh Foundation</p>
                        <p style="margin: 0 0 16px 0; font-size: 11px; color: #94A3B8;">A Cyber Safety & Community Initiative</p>
                        <p style="margin: 0; font-size: 11px; color: #94A3B8;">This is an automated notification. Please do not reply directly to this email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const mailer = {
  // 1. Proposal Raised (Notify admin & proposer)
  sendProposalRaisedAlert: async (proposal) => {
    // Alert Admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || "hello@projectdelhi.org",
      subject: `[Action Required] New Campaign Proposal Pending Review: ${proposal.title}`,
      html: getHtmlTemplate({
        title: "New Campaign Proposal Pending Review",
        preheader: "A new campaign proposal has been submitted on Project Delhi and is pending moderation.",
        contentHtml: `
          <p>Dear Administrator,</p>
          <p>A new campaign proposal has been submitted on Project Delhi and is currently pending review. Please review the campaign details below and take the necessary moderation action on your dashboard.</p>
          <p><strong>Campaign Description:</strong></p>
          <p style="white-space: pre-line; background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px 16px; border-radius: 6px; font-size: 14px; color: #475569;">${proposal.description}</p>
        `,
        details: [
          { label: "Campaign Title", value: proposal.title },
          { label: "Category", value: proposal.category },
          { label: "Proposer Name", value: proposal.applicantName },
          { label: "Email Address", value: proposal.email },
          { label: "Contact Phone", value: proposal.phone },
          { label: "Location/Address", value: `${proposal.address}, ${proposal.locality}, ${proposal.city} - ${proposal.pincode}` },
          { label: "Volunteers Needed", value: proposal.volunteersNeeded },
          { label: "Event Schedule", value: `${proposal.eventDate} at ${proposal.eventTime}` },
        ],
        button: {
          label: "Review Proposal",
          url: `${CLIENT_URL}/volunteer-dashboard`,
        },
      }),
    });

    // Send confirmation to proposer
    return sendEmail({
      to: proposal.email,
      subject: `We've Received Your Campaign Proposal: ${proposal.title}`,
      html: getHtmlTemplate({
        title: "We Received Your Proposal",
        preheader: "Thank you for submitting your campaign proposal to Project Delhi.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear ${proposal.applicantName},</p>
          <p>Thank you for submitting your campaign proposal <strong>"${proposal.title}"</strong> to Project Delhi. We appreciate your dedication to supporting our community.</p>
          <p>Our team of moderators is currently reviewing your proposal. The validation process typically takes 24 to 48 hours. You will receive email notifications as the status of your proposal updates or if our moderators require any clarifications.</p>
        `,
        button: {
          label: "Go to Proposer Dashboard",
          url: `${CLIENT_URL}/dashboard`,
        },
      }),
    });
  },

  // 2. Info Asked by Moderator (Send to Proposer)
  sendInfoRequestedNotice: async (userEmail, applicantName, proposalTitle, query) => {
    return sendEmail({
      to: userEmail,
      subject: `Clarification Needed for Your Campaign: ${proposalTitle}`,
      html: getHtmlTemplate({
        title: "Clarification Needed for Your Proposal",
        preheader: "A moderator has requested additional details or changes for your campaign proposal.",
        themeColor: "#D97706", // Warning Accent
        contentHtml: `
          <p>Dear ${applicantName},</p>
          <p>Our moderation team has reviewed your campaign proposal, <strong>"${proposalTitle}"</strong>, and requires additional information or revisions before it can be approved.</p>
          <p>Please review the coordinator's request below, make the necessary updates on your dashboard, and resubmit.</p>
        `,
        callout: {
          text: `<strong>Moderator's Request:</strong><br>"${query}"`,
          type: "warning",
        },
        button: {
          label: "Respond & Edit Proposal",
          url: `${CLIENT_URL}/dashboard`,
          color: "#D97706",
        },
      }),
    });
  },

  // 3. Proposal Approved / Goes Live (Send to Proposer)
  sendProposalApprovedNotice: async (userEmail, applicantName, proposalTitle) => {
    return sendEmail({
      to: userEmail,
      subject: `Congratulations! Your Campaign Proposal is Live: ${proposalTitle}`,
      html: getHtmlTemplate({
        title: "Your Campaign Proposal Has Been Approved",
        preheader: "Great news! Your campaign proposal is live on Project Delhi.",
        themeColor: "#16A34A", // Success Accent
        contentHtml: `
          <p>Dear ${applicantName},</p>
          <p>We are pleased to inform you that your campaign proposal <strong>"${proposalTitle}"</strong> has been approved and is now officially live on the Project Delhi site.</p>
          <p>Volunteers across Delhi can now browse, read about, and register to support your campaign. We encourage you to share your campaign page with your network to boost volunteer participation.</p>
        `,
        button: {
          label: "Explore Live Campaigns",
          url: `${CLIENT_URL}/initiatives`,
          color: "#16A34A",
        },
      }),
    });
  },

  // 4. Subscribed for Updates (Send to Subscriber)
  sendSubscriptionWelcome: async (subscriberEmail) => {
    return sendEmail({
      to: subscriberEmail,
      subject: "Welcome to Project Delhi - Subscription Confirmed",
      html: getHtmlTemplate({
        title: "Thank You for Subscribing",
        preheader: "Thank you for subscribing to our community and safety updates.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Hello,</p>
          <p>You have successfully subscribed to updates from <strong>Project Delhi</strong>, a community safety and developmental initiative powered by the Naksh Foundation.</p>
          <p>We will keep you informed about upcoming community cleanup drives, cyber awareness workshops, educational programs, and key progress reports. Together, we can make our city cleaner, safer, and more resilient.</p>
        `,
        button: {
          label: "Visit Project Delhi",
          url: CLIENT_URL,
        },
      }),
    });
  },

  // 5. General Volunteer Registered (Send to Volunteer & Admin)
  sendGeneralVolunteerWelcome: async (volunteer) => {
    // Notify Volunteer
    await sendEmail({
      to: volunteer.email,
      subject: "Welcome to the Project Delhi Volunteer Network",
      html: getHtmlTemplate({
        title: `Welcome to the Team, ${volunteer.name}`,
        preheader: "Thank you for joining our general volunteer pool.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear ${volunteer.name},</p>
          <p>Thank you for joining the general volunteer network for Project Delhi. Your profile has been successfully registered in our database.</p>
          <p>Whenever we organize cleanup drives, educational events, or cyber safety programs in Delhi that match your interest and preferred role, we will reach out to you with details on how to participate.</p>
        `,
        details: [
          { label: "Preferred Role", value: volunteer.preferredRole },
          { label: "Location", value: volunteer.location },
          { label: "Contact Phone", value: volunteer.phone },
        ],
        button: {
          label: "Visit Volunteer Platform",
          url: CLIENT_URL,
        },
      }),
    });

    // Alert Admin
    return sendEmail({
      to: process.env.ADMIN_EMAIL || "hello@projectdelhi.org",
      subject: `[New Registration] General Volunteer Joined Pool: ${volunteer.name}`,
      html: getHtmlTemplate({
        title: "New Volunteer Registered",
        preheader: "A new general volunteer has joined the pool.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear Administrator,</p>
          <p>A new volunteer has registered in the general volunteer pool. Here are their details:</p>
        `,
        details: [
          { label: "Name", value: volunteer.name },
          { label: "Email Address", value: volunteer.email },
          { label: "Phone Number", value: volunteer.phone },
          { label: "Preferred Role", value: volunteer.preferredRole },
          { label: "Preferred Location", value: volunteer.location },
        ],
      }),
    });
  },

  // 6. Volunteer Application Received (Specific Task)
  sendVolunteerAppReceived: async (appRecord, taskTitle) => {
    // Notify Volunteer
    await sendEmail({
      to: appRecord.email,
      subject: `Application Received: Volunteer Request for ${taskTitle}`,
      html: getHtmlTemplate({
        title: "Application Received",
        preheader: "Your application to volunteer has been successfully received.",
        themeColor: "#D97706", // Notification orange
        contentHtml: `
          <p>Dear ${appRecord.name},</p>
          <p>Your application to volunteer for the campaign <strong>"${taskTitle}"</strong> has been successfully received.</p>
          <p>The campaign coordinator and our moderation team are currently reviewing applicant profiles. You will receive an email update as soon as a selection decision is made.</p>
        `,
      }),
    });

    // Alert Admin / Moderator
    return sendEmail({
      to: process.env.ADMIN_EMAIL || "hello@projectdelhi.org",
      subject: `[Review Needed] Volunteer Application for ${taskTitle}`,
      html: getHtmlTemplate({
        title: "New Volunteering Application",
        preheader: "A new volunteer application is pending review.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear Administrator,</p>
          <p>A new volunteer application has been submitted for the campaign event: <strong>"${taskTitle}"</strong>.</p>
        `,
        details: [
          { label: "Campaign Event", value: taskTitle },
          { label: "Applicant Name", value: appRecord.name },
          { label: "Email Address", value: appRecord.email },
          { label: "Phone Number", value: appRecord.phone },
        ],
        callout: {
          text: `<strong>Statement of Interest / Experience:</strong><br>${appRecord.reason}`,
          type: "info",
        },
        button: {
          label: "Review Application on Dashboard",
          url: `${CLIENT_URL}/volunteer-dashboard`,
        },
      }),
    });
  },

  // 7. Volunteer Application Status Updated (Approved/Rejected)
  sendVolunteerAppStatusUpdate: async (appRecord, taskTitle, status, reason) => {
    const isApproved = status === "approved";
    const statusColor = isApproved ? "#16A34A" : "#DC2626";
    const statusText = isApproved ? "Approved" : "Declined";

    const contentHtml = isApproved
      ? `<p>Dear ${appRecord.name},</p>
         <p><strong>Congratulations! Your application to volunteer for the campaign "${taskTitle}" has been approved.</strong></p>
         <p>We are excited to have you on board! The campaign organizer will get in touch with you shortly via phone or email to coordinate logistics, schedules, and instructions for the event day.</p>`
      : `<p>Dear ${appRecord.name},</p>
         <p>Thank you for your interest in volunteering for the campaign <strong>"${taskTitle}"</strong>.</p>
         <p>After careful review of our current capacity and requirements, we regret to inform you that we are unable to accept your application for this specific campaign at this time.</p>`;

    const callout = isApproved
      ? null
      : {
          text: `<strong>Reason for decision:</strong><br>"${reason || "Slots are fully filled."}"`,
          type: "danger",
        };

    const encourageText = isApproved
      ? ""
      : `<p>We deeply appreciate your support and encourage you to explore and apply for other upcoming campaign opportunities on our platform.</p>`;

    return sendEmail({
      to: appRecord.email,
      subject: isApproved
        ? `Confirmed: Your Volunteering Application for ${taskTitle} is Approved`
        : `Update Regarding Your Volunteer Application: ${taskTitle}`,
      html: getHtmlTemplate({
        title: `Volunteer Application Status: ${statusText}`,
        preheader: `An update is available on your volunteer application for ${taskTitle}.`,
        themeColor: statusColor,
        contentHtml: contentHtml + encourageText,
        callout,
        button: {
          label: "View Volunteer Opportunities",
          url: `${CLIENT_URL}/initiatives`,
          color: statusColor,
        },
      }),
    });
  },

  // 8. Donation Receipt (Send to Donor)
  sendDonationReceipt: async (donorEmail, donorName, donationDetails) => {
    return sendEmail({
      to: donorEmail,
      subject: "Donation Receipt & Heartfelt Thanks: Naksh Foundation",
      html: getHtmlTemplate({
        title: "Thank You for Your Generous Support",
        preheader: "Thank you for your donation to the Naksh Foundation.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear ${donorName},</p>
          <p>On behalf of the entire Naksh Foundation team, we want to express our deepest gratitude for your generous donation of <strong>INR ${donationDetails.amount}</strong>.</p>
          <p>Your contribution directly supports our community cleanup drives, cyber safety awareness programs, and education kits for under-resourced children in Delhi. It is support like yours that drives real change in our society.</p>
        `,
        details: [
          { label: "Donor Name", value: donorName },
          { label: "Amount Contributed", value: `INR ${donationDetails.amount}` },
          { label: "Transaction Reference", value: donationDetails.txId || "N/A" },
          { label: "Receipt Date", value: new Date().toLocaleDateString("en-IN") },
        ],
        callout: {
          text: "<strong>Tax Exemption Note:</strong> Your donation is tax-exempt under Section 80G of the Indian Income Tax Act. A formal certificate will be sent to your registered address once verification is finalized.",
          type: "info",
        },
      }),
    });
  },

  // 9. Donation Report Acknowledgement (Send to Donor)
  sendDonationReportAcknowledgement: async (donorEmail, donorName, amount, method, txId) => {
    return sendEmail({
      to: donorEmail,
      subject: "Donation Report Logged & Verification Pending: Naksh Foundation",
      html: getHtmlTemplate({
        title: "Donation Report Logged",
        preheader: "We have received your manual donation report.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear ${donorName},</p>
          <p>Thank you for reporting your recent manual donation of <strong>INR ${amount}</strong> via ${method.toUpperCase()}.</p>
          <p>Our finance team is currently verifying the bank transfer with reference Transaction ID: <strong>${txId}</strong>. Once successfully validated, your formal tax-exempt 80G receipt certificate will be generated and emailed to you within 24 hours.</p>
          <p>If you have any questions or need to correct any details, please feel free to reply to this email.</p>
        `,
      }),
    });
  },

  // 10. General Partner Registered (Send to Partner & Admin)
  sendGeneralPartnerWelcome: async (partner) => {
    // Notify Partner
    await sendEmail({
      to: partner.email,
      subject: `Partnership Registration Confirmed: ${partner.orgName}`,
      html: getHtmlTemplate({
        title: "Partnership Registration Received",
        preheader: "Thank you for registering with the Project Delhi Partner Directory.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear ${partner.contactName},</p>
          <p>We are thrilled to receive your expression of interest to partner with Project Delhi. Your organization's details have been successfully registered in our partnership database.</p>
          ${
            partner.taskTitle
              ? `<p>Your proposal to collaborate on the event <strong>"${partner.taskTitle}"</strong> has been successfully submitted to the coordinators for review.</p>`
              : `<p>We will review your profile and reach out to you with collaboration opportunities for our upcoming community and safety campaigns.</p>`
          }
        `,
        details: [
          { label: "Organization Name", value: partner.orgName },
          { label: "Organization Type", value: partner.orgType },
          { label: "Representative", value: `${partner.contactName} (${partner.designation})` },
          { label: "Operating Location", value: partner.location },
          { label: "Contact Phone", value: partner.phone },
        ],
        callout: {
          text: `<strong>Collaboration Interest:</strong><br>${partner.collabReason}`,
          type: "info",
        },
      }),
    });

    // Alert Admin
    return sendEmail({
      to: process.env.ADMIN_EMAIL || "hello@projectdelhi.org",
      subject: `[Partnership Request] New Organization Registered: ${partner.orgName}`,
      html: getHtmlTemplate({
        title: "New Organization Registered",
        preheader: "A new organization has registered for partnership.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear Administrator,</p>
          <p>A new organization has registered in the partner directory. Here are the registration details:</p>
        `,
        details: [
          { label: "Org Name", value: partner.orgName },
          { label: "Type", value: partner.orgType },
          { label: "Contact Person", value: `${partner.contactName} (${partner.designation})` },
          { label: "Email Address", value: partner.email },
          { label: "Phone Number", value: partner.phone },
          { label: "Location", value: partner.location },
          { label: "Target Event", value: partner.taskTitle ? `${partner.taskTitle} (${partner.taskId})` : "General Partner Pool" },
        ],
        callout: {
          text: `<strong>Collaboration Proposal:</strong><br>${partner.collabReason}`,
          type: "info",
        },
      }),
    });
  },

  // 11. Password Reset Email (Send to User)
  sendPasswordResetEmail: async (email, name, resetLink) => {
    return sendEmail({
      to: email,
      subject: "Reset Your Project Delhi Password",
      html: getHtmlTemplate({
        title: "Password Reset Request",
        preheader: "Click the link to reset your account password.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear ${name},</p>
          <p>We received a request to reset the password for your account on Project Delhi. If you did not make this request, you can safely ignore this email; your account remains secure.</p>
          <p>To choose a new password, please click the button below. For security, this link will automatically expire in 1 hour:</p>
        `,
        button: {
          label: "Reset Password",
          url: resetLink,
        },
        callout: {
          text: `If the button above does not work, copy and paste the following URL into your web browser:<br><a href="${resetLink}" style="word-break: break-all; color: #8c2424;">${resetLink}</a>`,
          type: "info",
        },
      }),
    });
  },

  // 12. Proposal Deleted/Cancelled notice
  sendProposalDeletedNotice: async (userEmail, applicantName, proposalTitle, reason, deletedBy) => {
    return sendEmail({
      to: userEmail,
      subject: `Important Update: Campaign Proposal Cancelled - ${proposalTitle}`,
      html: getHtmlTemplate({
        title: "Campaign Proposal Cancelled",
        preheader: "Your campaign proposal has been cancelled.",
        themeColor: "#DC2626", // Danger Accent
        contentHtml: `
          <p>Dear ${applicantName},</p>
          <p>We are writing to notify you that your campaign proposal <strong>"${proposalTitle}"</strong> has been cancelled and removed from Project Delhi by ${deletedBy}.</p>
        `,
        callout: {
          text: `<strong>Reason for cancellation:</strong><br>"${reason}"`,
          type: "danger",
        },
      }),
    });
  },

  // 13. Proposal Edited notice
  sendProposalEditedNotice: async (userEmail, applicantName, proposalTitle) => {
    return sendEmail({
      to: userEmail,
      subject: `We've Received Your Proposal Revisions: ${proposalTitle}`,
      html: getHtmlTemplate({
        title: "Campaign Revisions Received",
        preheader: "We have received the edits to your campaign proposal.",
        themeColor: "#8c2424",
        contentHtml: `
          <p>Dear ${applicantName},</p>
          <p>This email confirms that your revisions for the campaign proposal <strong>"${proposalTitle}"</strong> have been successfully received.</p>
          <p>Our moderation team will review the updated campaign details. You will receive an email update as soon as the review is complete.</p>
        `,
      }),
    });
  },

  // 14. Proposal Query Raised notice
  sendProposalQueryRaisedNotice: async (userEmail, applicantName, proposalTitle, action, reason) => {
    const actionText = action === "delete" ? "Delete / Cancel" : "Edit Details";
    return sendEmail({
      to: userEmail,
      subject: `Update Request Logged for Campaign: ${proposalTitle}`,
      html: getHtmlTemplate({
        title: "Revision Query Acknowledged",
        preheader: "We have logged your request to edit/cancel your proposal.",
        themeColor: "#D97706", // Warning Accent
        contentHtml: `
          <p>Dear ${applicantName},</p>
          <p>We have successfully received your query requesting to <strong>${actionText}</strong> your active campaign, <strong>"${proposalTitle}"</strong>.</p>
          <p>A coordinator is reviewing your request and will follow up shortly. No further action is required from your end at this stage.</p>
        `,
        callout: {
          text: `<strong>Reason provided for request:</strong><br>"${reason}"`,
          type: "warning",
        },
      }),
    });
  },

  // 15. Proposal Allow Edit permission notice
  sendProposalAllowEditNotice: async (userEmail, applicantName, proposalTitle) => {
    return sendEmail({
      to: userEmail,
      subject: `Action Granted: You Can Now Edit Your Campaign - ${proposalTitle}`,
      html: getHtmlTemplate({
        title: "Edit Permission Granted",
        preheader: "You can now edit your campaign details.",
        themeColor: "#16A34A", // Success Accent
        contentHtml: `
          <p>Dear ${applicantName},</p>
          <p>An administrator has reviewed your request and granted edit permissions for your campaign proposal <strong>"${proposalTitle}"</strong>.</p>
          <p>The "Edit" button is now active on your proposer dashboard. Please log in and submit your revisions.</p>
        `,
        button: {
          label: "Go to Dashboard",
          url: `${CLIENT_URL}/dashboard`,
          color: "#16A34A",
        },
      }),
    });
  },

  // 16. Volunteer application slot cancellation notice
  sendVolunteerWithdrawNotice: async (userEmail, name, taskTitle, reason) => {
    return sendEmail({
      to: userEmail,
      subject: `Volunteering Slot Withdrawal Confirmed: ${taskTitle}`,
      html: getHtmlTemplate({
        title: "Volunteering Slot Withdrawal Confirmed",
        preheader: "Your volunteering slot withdrawal has been confirmed.",
        themeColor: "#DC2626", // Danger Accent
        contentHtml: `
          <p>Dear ${name},</p>
          <p>This is to confirm that you have successfully withdrawn your volunteering request and cancelled your slot for the campaign event: <strong>"${taskTitle}"</strong>.</p>
          <p>If you did this in error, or if your availability changes, you are welcome to sign up again on our platform at any time.</p>
        `,
        callout: {
          text: `<strong>Reason for withdrawal:</strong><br>"${reason || "Withdrawn by volunteer"}"`,
          type: "danger",
        },
        button: {
          label: "Browse Campaigns",
          url: `${CLIENT_URL}/initiatives`,
          color: "#DC2626",
        },
      }),
    });
  },

  // 17. Proposal Rejected (Send to Proposer)
  sendProposalRejectedNotice: async (userEmail, applicantName, proposalTitle, reason) => {
    return sendEmail({
      to: userEmail,
      subject: `Update Regarding Your Campaign Proposal: ${proposalTitle}`,
      html: getHtmlTemplate({
        title: "Proposal Update: Declined",
        preheader: "Your campaign proposal has been reviewed.",
        themeColor: "#DC2626", // Danger Accent
        contentHtml: `
          <p>Dear ${applicantName},</p>
          <p>Thank you for submitting your campaign proposal <strong>"${proposalTitle}"</strong> to Project Delhi.</p>
          <p>After careful consideration, our moderation team has decided to decline your proposal at this time.</p>
          <p>If you have any questions, would like to discuss this feedback, or wish to submit a revised proposal, please do not hesitate to reach out to our team.</p>
        `,
        callout: {
          text: `<strong>Moderator Feedback:</strong><br>"${reason}"`,
          type: "danger",
        },
      }),
    });
  },
};

module.exports = mailer;
