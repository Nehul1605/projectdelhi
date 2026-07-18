const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const DeletedTask = require("../models/DeletedTask");
const mailer = require("../config/mailer");
const { logActivity } = require("../utils/activityLogger");
const { toTitleCase, toSentenceCase } = require("../utils/textFormatter");

// Helper to sanitize and format input details professionally
const sanitizeTaskData = (data) => {
  const sanitized = { ...data };
  if (sanitized.title) sanitized.title = toTitleCase(sanitized.title);
  if (sanitized.applicantName) sanitized.applicantName = toTitleCase(sanitized.applicantName);
  if (sanitized.organizationName) sanitized.organizationName = toTitleCase(sanitized.organizationName);
  if (sanitized.designation) sanitized.designation = toTitleCase(sanitized.designation);
  if (sanitized.locality) sanitized.locality = toTitleCase(sanitized.locality);
  if (sanitized.city) sanitized.city = toTitleCase(sanitized.city);
  if (sanitized.address) sanitized.address = toSentenceCase(sanitized.address);
  return sanitized;
};

// Get all tasks
router.get("/tasks", async (req, res) => {
  try {
    // Automatically transition past approved events to "completed" status
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const approvedTasks = await Task.find({ status: "approved" });
    for (const task of approvedTasks) {
      if (task.eventDate) {
        const dateParts = task.eventDate.split('-');
        if (dateParts.length === 3) {
          const [year, month, day] = dateParts.map(Number);
          const duration = task.eventDuration || 1;
          const endOfEvent = new Date(year, month - 1, day + duration);
          if (today >= endOfEvent) {
            task.status = "completed";
            await task.save();
          }
        }
      }
    }

    const tasks = await Task.find({});
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post("/tasks", async (req, res) => {
  try {
    const sanitizedBody = sanitizeTaskData(req.body);
    const newTask = new Task({
      ...sanitizedBody,
      id: "task-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      status: "pending",
      createdAt: new Date().toISOString(),
      volunteers: []
    });
    await newTask.save();

    // Trigger proposal raised notification
    mailer.sendProposalRaisedAlert(newTask).catch((err) =>
      console.error("Failed to send proposal raised email:", err)
    );

    await logActivity({
      userName: newTask.applicantName,
      userEmail: newTask.email,
      action: "PROPOSAL_CREATED",
      details: `Raised a proposal titled "${newTask.title}" for locality "${newTask.locality}"`
    });

    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.put("/tasks/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    const update = { status };
    if (rejectionReason !== undefined) {
      update.rejectionReason = rejectionReason;
    }
    
    const task = await Task.findOneAndUpdate({ id }, update, { new: true });
    if (task) {
      if (status === "approved") {
        // Trigger approval notification
        mailer.sendProposalApprovedNotice(
          task.email,
          task.applicantName,
          task.title
        ).catch((err) =>
          console.error("Failed to send proposal approved email:", err)
        );
      } else if (status === "rejected") {
        // Trigger rejection notification with custom reason
        mailer.sendProposalRejectedNotice(
          task.email,
          task.applicantName,
          task.title,
          rejectionReason || "Criteria mismatch / incomplete details."
        ).catch((err) =>
          console.error("Failed to send proposal rejected email:", err)
        );
      }

      await logActivity({
        userEmail: task.email,
        userName: task.applicantName,
        action: "TASK_STATUS_UPDATED",
        details: `Proposal status for "${task.title}" updated to "${status}". Reason: "${rejectionReason || 'None'}"`
      });

      res.json({ success: true, task });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle/Set task featured status
router.put("/tasks/:id/featured", async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    if (isFeatured) {
      // Clear featured status from all other campaigns first
      await Task.updateMany({}, { isFeatured: false });
    }

    const task = await Task.findOneAndUpdate({ id }, { isFeatured }, { new: true });
    if (task) {
      await logActivity({
        userEmail: "admin@projectdelhi.org",
        userName: "Admin",
        action: "TASK_FEATURED_UPDATED",
        details: `Task "${task.title}" featured status updated to ${isFeatured}`
      });
      res.json({ success: true, task });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register volunteer for task
router.post("/tasks/:id/volunteers", async (req, res) => {
  try {
    const { id } = req.params;
    const volunteer = req.body;
    const task = await Task.findOne({ id });
    if (task) {
      if (task.volunteers.some((v) => v.email === volunteer.email)) {
        return res.status(400).json({ error: "Already registered with this email" });
      }
      const newVol = {
        ...volunteer,
        id: "vol-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
        joinedAt: new Date().toISOString()
      };
      task.volunteers.push(newVol);
      await task.save();

      await logActivity({
        userEmail: newVol.email,
        userName: newVol.name,
        action: "VOLUNTEER_REGISTERED",
        details: `Joined event "${task.title}" (${task.id}) as a volunteer`
      });

      res.json({ success: true, volunteer: newVol });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system stats
router.get("/stats", async (req, res) => {
  try {
    const tasks = await Task.find({});
    const approved = tasks.filter((t) => t.status === "approved");
    const completed = tasks.filter((t) => t.status === "completed");
    const pendingCount = tasks.filter((t) => t.status === "pending").length;

    // Calculate active + completed volunteers
    const activeVolunteersCount = [...approved, ...completed].reduce(
      (sum, t) => sum + (t.volunteers ? t.volunteers.length : 0),
      0
    );

    // Calculate volunteers from deleted tasks
    const deletedTasks = await DeletedTask.find({});
    const deletedVolunteersCount = deletedTasks.reduce(
      (sum, t) => sum + (t.volunteers ? t.volunteers.length : 0),
      0
    );

    const totalVolunteers = 26 + activeVolunteersCount + deletedVolunteersCount;

    // Calculate events conducted: completed in Task + completed in DeletedTask
    const completedTasksCount = completed.length;
    const completedDeletedTasksCount = deletedTasks.filter((t) => t.status === "completed").length;
    const eventsConducted = 3 + completedTasksCount + completedDeletedTasksCount;

    res.json({
      totalTasks: approved.length,
      totalVolunteers,
      totalPending: pendingCount,
      eventsConducted,
      deletedVolunteersCount,
      deletedEventsConductedCount: completedDeletedTasksCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request extra details from user
router.put("/tasks/:id/request", async (req, res) => {
  try {
    const { id } = req.params;
    const { moderatorRequest } = req.body;
    const task = await Task.findOneAndUpdate(
      { id },
      { moderatorRequest },
      { new: true }
    );
    if (task) {
      // Trigger info request notification
      mailer.sendInfoRequestedNotice(
        task.email,
        task.applicantName,
        task.title,
        moderatorRequest
      ).catch((err) =>
        console.error("Failed to send info requested email:", err)
      );

      await logActivity({
        userEmail: task.email,
        userName: task.applicantName,
        action: "INFO_REQUESTED",
        details: `Moderator requested additional info for proposal "${task.title}"`
      });

      res.json({ success: true, task });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User responds to moderator request
router.put("/tasks/:id/respond", async (req, res) => {
  try {
    const { id } = req.params;
    const { userResponse } = req.body;
    const task = await Task.findOneAndUpdate(
      { id },
      { userResponse },
      { new: true }
    );
    if (task) {
      await logActivity({
        userEmail: task.email,
        userName: task.applicantName,
        action: "INFO_PROVIDED",
        details: `User provided additional info response for proposal "${task.title}"`
      });

      res.json({ success: true, task });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a chat message (moderator <-> user)
router.post("/tasks/:id/chat", async (req, res) => {
  try {
    const { id } = req.params;
    const { sender, senderName, text } = req.body;
    
    if (!sender || !senderName || !text) {
      return res.status(400).json({ error: "Sender, senderName, and text are required" });
    }

    const task = await Task.findOne({ id });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const newMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      sender,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };

    task.chatMessages.push(newMessage);
    
    // Set query status to pending if moderator sent a message
    if (sender === "moderator") {
      task.userQueryStatus = "pending";
      
      // Send email alert only if it is the very first message from a moderator
      const priorModMsgsCount = task.chatMessages.filter(
        m => m.sender === "moderator" && m.id !== newMessage.id
      ).length;
      
      if (priorModMsgsCount === 0) {
        // Notify the user about the new query details message
        mailer.sendInfoRequestedNotice(
          task.email,
          task.applicantName,
          task.title,
          text
        ).catch((err) =>
          console.error("Failed to send info requested email:", err)
        );
      }

      await logActivity({
        userEmail: task.email,
        userName: task.applicantName,
        action: "INFO_REQUESTED",
        details: `Moderator sent a chat query for proposal "${task.title}": "${text.substring(0, 60)}..."`
      });
    } else if (sender === "user") {
      // User response activity log
      await logActivity({
        userEmail: task.email,
        userName: task.applicantName,
        action: "INFO_PROVIDED",
        details: `User responded via chat for proposal "${task.title}": "${text.substring(0, 60)}..."`
      });
    }

    await task.save();

    res.json({ success: true, chatMessages: task.chatMessages, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task (archives to DeletedTask before removal)
router.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { deletedBy, deletionReason } = req.body;
    
    const task = await Task.findOne({ id });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskData = task.toObject();
    delete taskData._id;
    
    // Create archived deleted task
    const archivedTask = new DeletedTask({
      ...taskData,
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy || task.email,
      deletionReason: deletionReason || "Deleted by owner"
    });
    await archivedTask.save();

    // Delete original task
    await Task.deleteOne({ id });

    // Send deletion email notification to user
    mailer.sendProposalDeletedNotice(
      task.email,
      task.applicantName,
      task.title,
      deletionReason || "Cancelled by owner",
      deletedBy || "owner"
    ).catch(err => console.error("Error sending deletion email:", err));

    await logActivity({
      userEmail: deletedBy || task.email,
      userName: deletedBy || task.applicantName,
      action: "PROPOSAL_DELETED",
      details: `Deleted proposal "${task.title}" (Reason: ${deletionReason || "None"}). Archived task successfully.`
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Raise query (edit/delete request) on verified/approved tasks
router.put("/tasks/:id/query", async (req, res) => {
  try {
    const { id } = req.params;
    const { userQueryAction, userQueryReason } = req.body;

    const task = await Task.findOne({ id });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.userQueryAction = userQueryAction;
    task.userQueryReason = userQueryReason;
    task.userQueryStatus = "pending";
    await task.save();

    // Send query raised email notification to user
    mailer.sendProposalQueryRaisedNotice(
      task.email,
      task.applicantName,
      task.title,
      userQueryAction,
      userQueryReason
    ).catch(err => console.error("Error sending query raised notice email:", err));

    await logActivity({
      userEmail: task.email,
      userName: task.applicantName,
      action: "PROPOSAL_QUERY_RAISED",
      details: `User requested "${userQueryAction}" action on proposal "${task.title}". Reason: ${userQueryReason}`
    });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Allow user to edit task (called by moderator/admin)
router.put("/tasks/:id/allow-edit", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({ id });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.allowUserEdit = true;
    task.userQueryStatus = "resolved";
    await task.save();

    // Send edit permission allowed email notification to user
    mailer.sendProposalAllowEditNotice(
      task.email,
      task.applicantName,
      task.title
    ).catch(err => console.error("Error sending allow edit notice email:", err));

    await logActivity({
      userEmail: task.email,
      userName: task.applicantName,
      action: "PROPOSAL_EDIT_ALLOWED",
      details: `Moderator/Admin allowed user to edit proposal "${task.title}"`
    });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve query (called by moderator/admin)
router.put("/tasks/:id/resolve-query", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({ id });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.userQueryStatus = "resolved";
    await task.save();

    await logActivity({
      userEmail: task.email,
      userName: task.applicantName,
      action: "PROPOSAL_QUERY_RESOLVED",
      details: `Moderator/Admin resolved query for proposal "${task.title}"`
    });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User submit proposal edits
router.put("/tasks/:id/edit-proposal", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({ id });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check authorization: must be pending OR allowed to edit
    if (task.status !== "pending" && !task.allowUserEdit) {
      return res.status(403).json({
        error: "This proposal has already been verified/approved and cannot be edited without permission."
      });
    }

    const sanitizedBody = sanitizeTaskData(req.body);
    const updatableFields = [
      "title", "description", "shortDescription", "category",
      "eventDate", "eventTime", "volunteersNeeded", "eventDuration",
      "address", "locality", "pincode", "city",
      "organizationName", "organizationType", "designation", "imageUrl"
    ];
    updatableFields.forEach(f => {
      if (sanitizedBody[f] !== undefined) {
        task[f] = sanitizedBody[f];
      }
    });

    task.allowUserEdit = false;
    task.userQueryStatus = "resolved";
    await task.save();

    // Send proposal edited email notification to user
    mailer.sendProposalEditedNotice(
      task.email,
      task.applicantName,
      task.title
    ).catch(err => console.error("Error sending proposal edit notice:", err));

    await logActivity({
      userEmail: task.email,
      userName: task.applicantName,
      action: "PROPOSAL_EDITED",
      details: `User submitted edits for proposal "${task.title}"`
    });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Moderator/Admin edit proposal details before approval/rejection
router.put("/tasks/:id/admin-edit", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ id });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const sanitizedBody = sanitizeTaskData(req.body);
    const updatableFields = [
      "title", "description", "shortDescription", "category",
      "eventDate", "eventTime", "volunteersNeeded", "eventDuration",
      "address", "locality", "pincode", "city",
      "organizationName", "organizationType", "designation", "imageUrl"
    ];
    updatableFields.forEach(f => {
      if (sanitizedBody[f] !== undefined) {
        task[f] = sanitizedBody[f];
      }
    });

    await task.save();

    await logActivity({
      action: "PROPOSAL_EDITED_BY_STAFF",
      details: `Moderator/Admin updated details for task "${task.title}"`
    });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
