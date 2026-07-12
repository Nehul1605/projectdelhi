const express = require("express");
const router = express.Router();
const VolunteerApp = require("../models/VolunteerApp");
const Subscriber = require("../models/Subscriber");
const GeneralVolunteer = require("../models/GeneralVolunteer");
const Donation = require("../models/Donation");
const GeneralPartner = require("../models/GeneralPartner");
const mailer = require("../config/mailer");
const { logActivity } = require("../utils/activityLogger");
const { toTitleCase, toSentenceCase } = require("../utils/textFormatter");

// Get all volunteer applications
router.get("/volunteer-apps", async (req, res) => {
  try {
    const apps = await VolunteerApp.find({});
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit volunteer application
router.post("/volunteer-apps", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const taskId = req.body.taskId;

    // 1. Check if they have already submitted a pending/processed application
    const existingApp = await VolunteerApp.findOne({
      taskId,
      email: { $regex: new RegExp(`^${email}$`, "i") }
    });
    if (existingApp) {
      return res.status(400).json({ 
        error: existingApp.status === "approved" 
          ? "You are already registered as a volunteer for this event!" 
          : "You have already submitted a volunteer application for this event!" 
      });
    }

    // 2. Check if they are already in the approved volunteers list of the task
    const Task = require("../models/Task");
    const task = await Task.findOne({ id: taskId });
    if (task && task.volunteers.some(v => (v.email || "").toLowerCase().trim() === email)) {
      return res.status(400).json({ error: "You are already registered as a volunteer for this event!" });
    }

    const newApp = new VolunteerApp({
      ...req.body,
      name: toTitleCase(req.body.name),
      reason: toSentenceCase(req.body.reason),
      prevExperience: toSentenceCase(req.body.prevExperience),
      id: "vapp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      status: "applied",
      createdAt: new Date().toISOString()
    });
    await newApp.save();

    // Use already fetched task details to get title for the email
    const taskTitle = task ? task.title : "Community Initiative";

    // Send application receipt and alert admin
    mailer.sendVolunteerAppReceived(newApp, taskTitle).catch((err) =>
      console.error("Failed to send volunteer application received email:", err)
    );

    await logActivity({
      userEmail: newApp.email,
      userName: newApp.name,
      action: "VOLUNTEER_REGISTERED",
      details: `Registered to volunteer for event "${taskTitle}" (${newApp.taskId})`
    });

    res.json(newApp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update volunteer application status
router.put("/volunteer-apps/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    const update = { status };
    if (rejectionReason !== undefined) {
      update.rejectionReason = rejectionReason;
    }
    
    const appRecord = await VolunteerApp.findOneAndUpdate({ id }, update, { new: true });
    if (appRecord) {
      const Task = require("../models/Task");
      const task = await Task.findOne({ id: appRecord.taskId });
      const taskTitle = task ? task.title : "Community Initiative";

      if (status === "approved" && task) {
        if (!task.volunteers.some((v) => v.email === appRecord.email)) {
          task.volunteers.push({
            id: "vol-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
            name: appRecord.name,
            email: appRecord.email,
            phone: appRecord.phone,
            joinedAt: new Date().toISOString(),
            message: appRecord.reason
          });
          await task.save();
        }
      }

      // Send approval or rejection email notification to the applicant
      if (status === "approved" || status === "rejected") {
        mailer.sendVolunteerAppStatusUpdate(appRecord, taskTitle, status, rejectionReason).catch((err) =>
          console.error("Failed to send volunteer status update email:", err)
        );
      }

      await logActivity({
        userEmail: appRecord.email,
        userName: appRecord.name,
        action: "VOLUNTEER_STATUS_UPDATED",
        details: `Volunteer application status for event "${taskTitle}" set to "${status}". Reason: "${rejectionReason || 'None'}"`
      });

      res.json({ success: true, application: appRecord });
    } else {
      res.status(404).json({ error: "Application not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to newsletter updates
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const existing = await Subscriber.findOne({ email: cleanEmail });
    if (existing) {
      return res.json({ success: true, message: "You are already subscribed!" });
    }

    const newSub = new Subscriber({
      email: cleanEmail,
      createdAt: new Date().toISOString()
    });
    await newSub.save();

    // Trigger welcome subscription email
    mailer.sendSubscriptionWelcome(cleanEmail).catch((err) =>
      console.error("Failed to send subscription welcome email:", err)
    );

    await logActivity({
      userEmail: cleanEmail,
      action: "NEWSLETTER_SUBSCRIBED",
      details: "User subscribed to newsletter updates"
    });

    res.json({ success: true, message: "Thank you for subscribing!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of newsletter subscribers
router.get("/subscribers", async (req, res) => {
  try {
    const subs = await Subscriber.find({}).sort({ createdAt: -1 });
    res.json(subs.map(s => s.email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register as a general volunteer
router.post("/general-volunteers", async (req, res) => {
  try {
    const { name, email, phone, preferredRole, location } = req.body;
    if (!name || !email || !phone || !preferredRole || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const existing = await GeneralVolunteer.findOne({ email: cleanEmail });
    if (existing) {
      return res.json({ success: true, message: "You are already registered as a volunteer!" });
    }

    const newVol = new GeneralVolunteer({
      name: toTitleCase(name),
      email: cleanEmail,
      phone: phone.trim(),
      preferredRole: toTitleCase(preferredRole),
      location: toTitleCase(location),
      createdAt: new Date().toISOString(),
    });
    await newVol.save();

    // Trigger welcome email and admin notification
    mailer.sendGeneralVolunteerWelcome(newVol).catch((err) =>
      console.error("Failed to send general volunteer welcome email:", err)
    );

    await logActivity({
      userName: newVol.name,
      userEmail: newVol.email,
      action: "GENERAL_VOLUNTEER_ADDED",
      details: `Registered to general volunteer pool with role "${newVol.preferredRole}"`
    });

    res.json({ success: true, message: "Thank you for registering! We will reach out to you soon." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all general volunteers
router.get("/general-volunteers", async (req, res) => {
  try {
    const vols = await GeneralVolunteer.find({}).sort({ createdAt: -1 });
    res.json(vols);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Report a new donation
router.post("/donations/report", async (req, res) => {
  try {
    const { name, email, phone, amount, method, transactionId } = req.body;
    if (!name || !email || !phone || !amount || !method || !transactionId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    // Check for duplicate transaction ID
    const existing = await Donation.findOne({ transactionId: transactionId.trim() });
    if (existing) {
      return res.status(400).json({ error: "A donation with this Transaction ID has already been reported." });
    }

    const newDonation = new Donation({
      id: "don-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      amount: Number(amount),
      method: method.trim(),
      transactionId: transactionId.trim(),
      status: "pending",
      createdAt: new Date().toISOString()
    });

    await newDonation.save();

    // Send confirmation email asynchronously to avoid blocking the API response
    mailer.sendDonationReportAcknowledgement(
      cleanEmail,
      name.trim(),
      Number(amount),
      method.trim(),
      transactionId.trim()
    ).catch(err => console.error("Error sending donation report acknowledgement:", err));

    await logActivity({
      userName: newDonation.name,
      userEmail: newDonation.email,
      action: "DONATION_REPORTED",
      details: `Reported donation of INR ${newDonation.amount} via ${newDonation.method} (TxID: ${newDonation.transactionId})`
    });

    res.json({ success: true, donation: newDonation, message: "Donation reported successfully! We will verify it and send your receipt soon." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all donation reports
router.get("/donations", async (req, res) => {
  try {
    const donations = await Donation.find({}).sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update donation report status (Approve / Reject)
router.put("/donations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "approved" | "rejected"
    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const donation = await Donation.findOne({ id });
    if (!donation) {
      return res.status(404).json({ error: "Donation report not found" });
    }

    donation.status = status;
    if (status === "approved") {
      donation.approvedAt = new Date().toISOString();
      
      // Trigger SMTP receipt email
      mailer.sendDonationReceipt(donation.email, donation.name, {
        amount: donation.amount,
        txId: donation.transactionId
      }).catch((err) =>
        console.error("Failed to send donation receipt email:", err)
      );
    }

    await donation.save();

    await logActivity({
      userEmail: donation.email,
      userName: donation.name,
      action: "DONATION_STATUS_UPDATED",
      details: `Donation report status updated to "${status}" for TxID ${donation.transactionId}`
    });

    res.json({ success: true, donation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register as a general partner organization
router.post("/general-partners", async (req, res) => {
  try {
    const { orgName, orgType, contactName, designation, email, phone, collabReason, location, taskId, taskTitle } = req.body;
    if (!orgName || !orgType || !contactName || !designation || !email || !phone || !collabReason || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const newPartner = new GeneralPartner({
      id: "part-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      taskId,
      taskTitle,
      orgName: toTitleCase(orgName),
      orgType: orgType.trim(),
      contactName: toTitleCase(contactName),
      designation: toTitleCase(designation),
      email: cleanEmail,
      phone: phone.trim(),
      collabReason: toSentenceCase(collabReason),
      location: toTitleCase(location),
      status: "applied",
      createdAt: new Date().toISOString()
    });

    await newPartner.save();

    // Trigger welcome/acknowledgement email to the registered partner organization
    mailer.sendGeneralPartnerWelcome(newPartner).catch((err) =>
      console.error("Failed to send general partner welcome email:", err)
    );

    await logActivity({
      userName: newPartner.contactName,
      userEmail: newPartner.email,
      action: "GENERAL_PARTNER_ADDED",
      details: `Registered organization "${newPartner.orgName}" (${newPartner.orgType}) for partnership${newPartner.taskTitle ? ` on event "${newPartner.taskTitle}"` : ""}`
    });

    res.json({ success: true, message: "Thank you for registering your organization! We will contact you for partnership opportunities soon." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all general partner organizations
router.get("/general-partners", async (req, res) => {
  try {
    const partners = await GeneralPartner.find({}).sort({ createdAt: -1 });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update partner application status
router.put("/general-partners/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== "approved" && status !== "rejected" && status !== "interviewing") {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const partnerRecord = await GeneralPartner.findOneAndUpdate({ id }, { status }, { new: true });
    if (partnerRecord) {
      await logActivity({
        userName: partnerRecord.contactName,
        userEmail: partnerRecord.email,
        action: "PARTNER_STATUS_UPDATED",
        details: `Partner application status for "${partnerRecord.orgName}" updated to "${status}"`
      });

      res.json({ success: true, partner: partnerRecord });
    } else {
      res.status(404).json({ error: "Partnership application not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Withdraw/Cancel volunteer application
router.delete("/volunteer-apps/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const appRecord = await VolunteerApp.findOne({ id });
    if (!appRecord) {
      return res.status(404).json({ error: "Volunteer application not found" });
    }

    const Task = require("../models/Task");
    const task = await Task.findOne({ id: appRecord.taskId });
    const taskTitle = task ? task.title : "Community Initiative";

    // If the application was approved, remove the user from Task.volunteers array
    if (task && appRecord.status === "approved") {
      task.volunteers = task.volunteers.filter((v) => v.email !== appRecord.email);
      await task.save();
    }

    // Delete the application record
    await VolunteerApp.deleteOne({ id });

    // Send withdrawal email notification to volunteer
    mailer.sendVolunteerWithdrawNotice(appRecord.email, appRecord.name, taskTitle, reason).catch((err) =>
      console.error("Failed to send volunteer withdraw email:", err)
    );

    await logActivity({
      userEmail: appRecord.email,
      userName: appRecord.name,
      action: "VOLUNTEER_WITHDRAWN",
      details: `Withdrew/Cancelled volunteering slot for event "${taskTitle}" (Reason: ${reason || "None"})`
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
