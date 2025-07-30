// model/ExtensionActivity.js
const mongoose = require("mongoose");

const extensionActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  domain: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  skillName: {
    type: String,
    default: "Unknown"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ExtensionActivity", extensionActivitySchema);
