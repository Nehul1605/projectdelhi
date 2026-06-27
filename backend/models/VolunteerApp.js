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
  rejectionReason: { type: String, default: "" }
});

module.exports = mongoose.model("VolunteerApp", VolunteerAppSchema);
