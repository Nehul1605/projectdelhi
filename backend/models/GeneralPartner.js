const mongoose = require("mongoose");

const GeneralPartnerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  taskId: { type: String },
  taskTitle: { type: String },
  orgName: { type: String, required: true },
  orgType: { type: String, required: true },
  contactName: { type: String, required: true },
  designation: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  collabReason: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, default: "applied" },
  createdAt: { type: String, required: true }
});

module.exports = mongoose.model("GeneralPartner", GeneralPartnerSchema);
