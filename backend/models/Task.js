const mongoose = require("mongoose");

const VolunteerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  joinedAt: { type: String, required: true },
  message: { type: String }
});

const ChatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true }, // "moderator" | "user"
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
});

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: false },
  category: { type: String, required: true },
  applicantType: { type: String, required: true },
  applicantName: { type: String, required: true },
  organizationName: { type: String },
  organizationType: { type: String },
  designation: { type: String },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  locality: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  eventDate: { type: String, required: true },
  eventTime: { type: String, required: false },
  volunteersNeeded: { type: Number, required: true },
  eventDuration: { type: Number, required: true, default: 1 },
  status: { type: String, default: "pending" },
  createdAt: { type: String, required: true },
  volunteers: { type: [VolunteerSchema], default: [] },
  moderatorRequest: { type: String },
  userResponse: { type: String },
  allowUserEdit: { type: Boolean, default: false },
  userQueryAction: { type: String, default: null },
  userQueryReason: { type: String, default: "" },
  userQueryStatus: { type: String, default: null },
  chatMessages: { type: [ChatMessageSchema], default: [] },
  rejectionReason: { type: String, default: "" },
  isFeatured: { type: Boolean, default: false }
});

module.exports = mongoose.model("Task", TaskSchema);
