// model/SiteSkillMapping.js
const mongoose = require("mongoose");

const siteSkillMappingSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true
  },
  skillName: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("SiteSkillMapping", siteSkillMappingSchema);
