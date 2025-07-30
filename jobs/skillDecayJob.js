// jobs/skillDecayJob.js
const cron = require('node-cron');
const skills = require("../model/skill");
const Skills = skills.Skills;
const { calculateSkillDecay } = require('../utills/skillDecay');
const  sendSMS = require('../utills/sendSMS');

const processSkillDecay = async () => {
    try {
        console.log('Starting weekly skill decay processing...');
        
        // Get all skills from database
        const allSkills = await Skills.find({});
        
        let processedCount = 0;
        let decayedCount = 0;
        
        for (const skill of allSkills) {
            const decayInfo = calculateSkillDecay(skill);
            
            // Update skill with decay information
            const updatedSkill = await Skills.findByIdAndUpdate(
                skill._id,
                {
                    $set: {
                        decayStatus: decayInfo.decayStatus,
                        decayPercentage: decayInfo.decayPercentage,
                        daysSinceLastUsed: decayInfo.daysSinceLastUsed,
                        lastDecayCalculation: new Date()
                    }
                },
                { new: true }
            );
            
            processedCount++;
            
            // Log skills that need attention
            if (decayInfo.decayStatus === 'Rusty' || decayInfo.decayStatus === 'Decaying') {
                console.log(`⚠️  Skill "${skill.name}" for user ${skill.userId} is ${decayInfo.decayStatus}`);
                decayedCount++;
            }
        }
        
        console.log(`✅ Processed ${processedCount} skills, ${decayedCount} need attention`);
        
        console.log('Weekly skill decay processing completed.');
        console.log("sending sms to users");
        sendSMS.findSkillsRequiringAttention();
        
    } catch (error) {
        console.error('Error processing skill decay:', error);
    }
};

// Schedule to run every Sunday at 2 AM[20]
const startSkillDecayScheduler = () => {
    cron.schedule('0 2 * * 0', processSkillDecay, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    
    console.log('📅 Skill decay scheduler started - runs every Sunday at 2 AM');
};

// Manual trigger for testing
const runDecayProcessNow = processSkillDecay;

module.exports = { 
    startSkillDecayScheduler, 
    runDecayProcessNow 
};
