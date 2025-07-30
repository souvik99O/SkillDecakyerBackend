require("dotenv").config();
const client = require("twilio")(process.env.TWILIO_ID, process.env.AUTH_TOKEN);
const skill = require("../model/skill");
const User = require("../model/user");
const users = User.User;
const skills = skill.Skills;

const sendSMS = async (mobileNumber, message) => {
  try {
    const messageResponse = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: mobileNumber,
    });

    console.log(`SMS sent successfully. SID: ${messageResponse.sid}`);
    return messageResponse;
  } catch (err) {
    console.error(`Failed to send SMS to ${mobileNumber}:`, err);
    throw err;
  }
};

exports.findSkillsRequiringAttention = async () => {
  try {
    console.log("Finding skills requiring attention...");
    const allSkills = await skills.find({ daysSinceLastUsed: { $gt: 12 } });

    console.log(`Found ${allSkills.length} skills requiring attention`);

    // Group skills by userId
    const skillsByUser = {};
    
    for (const skillData of allSkills) {
      if (!skillsByUser[skillData.userId]) {
        skillsByUser[skillData.userId] = [];
      }
      skillsByUser[skillData.userId].push(skillData);
    }

    // Send one consolidated message per user
    for (const userId in skillsByUser) {
      try {
        const user = await users.findOne({ userId: userId });
        
        if (user && user.phone) {
          const userSkills = skillsByUser[userId];
          
          // Create consolidated message
          let message = "🎯 Skill Practice Reminder:\n\n";
          
          userSkills.forEach((skill, index) => {
            message += `${index + 1}. ${skill.name} (${skill.daysSinceLastUsed} days ago)\n`;
          });
          
          message += "\n💪 Keep your skills sharp by practicing them soon!";
          
          await sendSMS(user.phone, message);
          
          console.log(`✅ Consolidated SMS sent to user ${userId} for ${userSkills.length} skills`);
        } else {
          console.log(`User not found or no phone number for userId: ${userId}`);
        }
      } catch (userError) {
        console.error(`Error processing skills for userId ${userId}:`, userError);
      }
    }
  } catch (err) {
    console.error("Error finding skills requiring attention:", err);
  }
};

exports.sendSMS = sendSMS;
