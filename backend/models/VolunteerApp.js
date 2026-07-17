const mongoose = require("mongoose");

const VolunteerAppSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  taskId: { type: String, required: true },
  taskTitle: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  reason: { type: String, required: true },
  prevExperience: { type: String },
  status: { type: String, default: "applied" },
  createdAt: { type: String, required: true },
  rejectionReason: { type: String, default: "" },
  conversationUpdates: [
    {
      updatedBy: { type: String, required: true },
      userName: { type: String, required: true },
      role: { type: String, required: true },
      notes: { type: String, required: true },
      createdAt: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model("VolunteerApp", VolunteerAppSchema);
