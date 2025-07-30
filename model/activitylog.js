
const mongoose = require("mongoose");
const { Schema }= mongoose;

const activityLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  skillId: {
    type:  Schema.Types.ObjectId,
    ref: "Skill"
  },
  note: {
    type: String
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
