const Activity = require("../models/Activity");

const logActivity = async ({ req, userId, userName, userEmail, action, details }) => {
  try {
    let finalUserId = userId || null;
    let finalUserName = userName || null;
    let finalUserEmail = userEmail || null;

    // If request object is passed, extract authenticated user details
    if (req && req.user) {
      if (!finalUserId) finalUserId = req.user.id || req.user._id || null;
      if (!finalUserName) finalUserName = req.user.name || null;
      if (!finalUserEmail) finalUserEmail = req.user.email || null;
    }

    const activity = new Activity({
      userId: finalUserId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      action,
      details,
    });

    await activity.save();
    console.log(`[ACTIVITY LOGGED] ${action} - ${details} (${finalUserEmail || "Anonymous"})`);
  } catch (err) {
    console.error("Failed to log activity to database:", err);
  }
};

module.exports = { logActivity };
