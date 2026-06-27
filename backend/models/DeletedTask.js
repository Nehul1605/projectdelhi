const mongoose = require("mongoose");

const DeletedTaskSchema = new mongoose.Schema({
  // Original Task attributes (all optional to avoid archival failures)
  id: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  shortDescription: { type: String },
  category: { type: String },
  applicantType: { type: String },
  applicantName: { type: String },
  organizationName: { type: String },
  organizationType: { type: String },
  designation: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  locality: { type: String },
  city: { type: String },
  pincode: { type: String },
  eventDate: { type: String },
  eventTime: { type: String },
  volunteersNeeded: { type: Number },
  status: { type: String },
  createdAt: { type: String },
  volunteers: { type: Array, default: [] },
  moderatorRequest: { type: String },
  userResponse: { type: String },
  allowUserEdit: { type: Boolean },
  userQueryAction: { type: String },
  userQueryReason: { type: String },
  userQueryStatus: { type: String },

  // Audit attributes
  deletedAt: { type: String, required: true },
  deletedBy: { type: String, required: true },
  deletionReason: { type: String, default: "" }
});

module.exports = mongoose.model("DeletedTask", DeletedTaskSchema);
