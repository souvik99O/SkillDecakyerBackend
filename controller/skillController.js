const skills = require("../model/skill");
const Skills = skills.Skills;
const firebaseAdmin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const { calculateSkillDecay } = require('../utills/skillDecay');
const secretKey = process.env.SECRETJWT;

exports.logskill = async (req, res) => {
  try {
    const skilldata = req.body;
    const skill = new Skills(skilldata);
    await skill.save();
    res.status(201).send(skill)
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message }); // ✅ Correct syntax

  }
};


exports.updateSkill = async (req, res) => {
    try {
        const currentUserId = req.params.id;
        const skillData = req.body;
        const updatedSkill = await Skills.findOneAndUpdate(
            { 
                userId: currentUserId,
                name: skillData.name 
            },
            {
                $set: {
                    category: skillData.category,
                    level: skillData.level,
                    lastUsed: skillData.lastUsed,
                    updatedAt: new Date()
                }
            },
            { 
                new: true,           // Return updated document
                upsert: true,        // Create if doesn't exist
                runValidators: true  // Run schema validation
            }
        );
        
        res.status(200).send(updatedSkill);

    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
};


exports.getSkillsWithDecay = async (req, res) => {
    try {
      console.log("getAllSkill is called from frontend");
        const currentUserId = req.params.id;
        const userSkills = await Skills.find({ userId: currentUserId });
        
        // Calculate real-time decay for each skill
        const skillsWithDecay = userSkills.map(skill => {
            const decayInfo = calculateSkillDecay(skill.toObject());
            return {
                ...skill.toObject(),
                ...decayInfo
            };
        });
        
        res.send(skillsWithDecay);
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err.message });

    }
};

exports.triggerDecayCalculation = async (req, res) => {
    try {
        const { runDecayProcessNow } = require('../jobs/skillDecayJob');
        await runDecayProcessNow();
        res.status(200).send({ message: 'Decay calculation completed successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
};


exports.deleteSkill = async (req, res) => {
    try {
        const { skillId, userId } = req.params;
        
        // Validate required parameters
        if (!skillId || !userId) {
            return res.status(400).json({ 
                error: 'Missing skillId or userId parameters' 
            });
        }
        
        console.log(`Attempting to delete skill ${skillId} for user ${userId}`);
        
        // Find and delete the skill that belongs to the specific user
        const deletedSkill = await Skills.findOneAndDelete({ 
            _id: skillId, 
            userId: userId 
        });
        
        // Check if skill was found and deleted
        if (!deletedSkill) {
            return res.status(404).json({ 
                error: 'Skill not found or you are not authorized to delete this skill' 
            });
        }
        
        console.log(`Successfully deleted skill: ${deletedSkill.name}`);
        
        // Return success response
        return res.status(200).json({ 
            message: 'Skill deleted successfully',
            deletedSkill: {
                id: deletedSkill._id,
                name: deletedSkill.name,
                category: deletedSkill.category
            }
        });
        
    } catch (error) {
        console.error('Error deleting skill:', error);
        
        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                error: 'Invalid skill ID format' 
            });
        }
        
        return res.status(500).json({ 
            error: 'Internal server error while deleting skill' 
        });
    }
};




//-------------------------------------------------------------------AI RECOMENDATIONS--------------------------------------------
exports.getCareerRecommendations = async (req, res) => {
    try {
        const currentUserId = req.params.id;
        
        // Check if we have cached recommendations for this user
        const cachedRecommendations = await getCachedCareerRecommendations(currentUserId);
        if (cachedRecommendations) {
            console.log('Returning cached career recommendations');
            return res.status(200).json({
                success: true,
                data: cachedRecommendations,
                cached: true
            });
        }
        
        // Get user skills with decay information
        const userSkills = await Skills.find({ userId: currentUserId });
        
        if (!userSkills || userSkills.length === 0) {
            return res.status(400).json({ 
                error: 'No skills found for user. Please add skills first.',
                message: 'Add some skills to get personalized career recommendations'
            });
        }
        
        // Create a hash of current skills to detect changes
        const skillsHash = createSkillsHash(userSkills);
        
        // Prepare skills data for AI analysis
        const skillsAnalysis = userSkills.map(skill => {
            const decayInfo = calculateSkillDecay(skill.toObject());
            return {
                name: skill.name,
                category: skill.category,
                level: skill.level,
                daysSinceLastUsed: decayInfo.daysSinceLastUsed,
                decayStatus: decayInfo.decayStatus,
                decayPercentage: decayInfo.decayPercentage
            };
        });
        
        // Create detailed prompt for Gemini
        const skillsText = skillsAnalysis.map(skill => 
            `${skill.name} (${skill.level} level in ${skill.category}, ${skill.decayStatus} - last used ${skill.daysSinceLastUsed} days ago)`
        ).join(', ');
        
        const prompt = `Based on the following user skills, provide 3 personalized career path recommendations and 5 actionable next steps:

User Skills Portfolio: ${skillsText}

Skill Categories Present: ${[...new Set(skillsAnalysis.map(s => s.category))].join(', ')}
Total Skills: ${skillsAnalysis.length}
Fresh Skills: ${skillsAnalysis.filter(s => s.decayStatus === 'Fresh').length}
Skills Needing Practice: ${skillsAnalysis.filter(s => s.decayStatus === 'Needs Practice' || s.decayStatus === 'Rusty').length}

IMPORTANT: Provide CONSISTENT recommendations. Use a deterministic approach based on the skills provided.

For each career recommendation, provide:
- Career Title (specific role name)
- Description (2-3 sentences explaining the role and why it fits)
- Match Percentage (60-95% based on current skills alignment)
- Required Skills (4-6 key skills needed, mark which ones user already has)
- Salary Range (realistic range in USD)
- Growth Potential (High/Medium/Low with brief explanation)
- Icon (FontAwesome icon class)

For next steps, provide 5 specific actionable items:
- Title (clear action to take)
- Description (1-2 sentences explaining what to do and why)
- Time Estimate (realistic timeframe like "2-3 months", "6 weeks")
- Difficulty Level (Beginner/Intermediate/Advanced)
- Priority (High/Medium/Low based on career impact)

Format as valid JSON:
{
  "careers": [
    {
      "title": "Senior Full Stack Developer",
      "description": "Lead development of web applications using modern technologies. Perfect fit given your JavaScript and React skills.",
      "matchPercentage": 85,
      "requiredSkills": ["JavaScript ✓", "React ✓", "Node.js", "Database Design", "System Architecture", "Team Leadership"],
      "salaryRange": "$80,000 - $120,000",
      "growthPotential": "High - Strong demand in tech industry",
      "icon": "fas fa-code"
    }
  ],
  "nextSteps": [
    {
      "title": "Master Advanced React Patterns",
      "description": "Learn React hooks, context API, and performance optimization to become a React expert.",
      "timeEstimate": "2-3 months",
      "difficulty": "Intermediate",
      "priority": "High"
    }
  ],
  "summary": "Your skill portfolio shows strong technical foundation with opportunities for leadership roles",
  "skillsAnalysis": {
    "strengths": ["Strong programming foundation", "Diverse skill set"],
    "gaps": ["Leadership skills", "System design"],
    "recommendations": ["Focus on system architecture", "Develop soft skills"]
  }
}

Make recommendations specific, actionable, and CONSISTENT based on the actual skills provided.`;

        // Call Gemini API with consistent parameters
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1, // FIXED: Lower temperature for consistency
                    maxOutputTokens: 3000,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;
        
        // Extract and parse JSON
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }
        
        const recommendations = JSON.parse(jsonMatch[0]);
        
        // Add metadata
        recommendations.generatedAt = new Date().toISOString();
        recommendations.basedOnSkills = skillsAnalysis.length;
        recommendations.userSkillsSnapshot = skillsAnalysis;
        recommendations.skillsHash = skillsHash;
        
        // Cache the recommendations
        await cacheCareerRecommendations(currentUserId, recommendations, skillsHash);
        
        res.status(200).json({
            success: true,
            data: recommendations
        });
        
    } catch (error) {
        console.error('Error generating career recommendations:', error);
        res.status(500).json({ 
            error: 'Failed to generate career recommendations',
            message: error.message
        });
    }
};

// Helper function to create a hash of skills for change detection
function createSkillsHash(skills) {
    const skillsString = skills
        .map(skill => `${skill.name}-${skill.category}-${skill.level}`)
        .sort()
        .join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < skillsString.length; i++) {
        const char = skillsString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

// Helper function to get cached recommendations
async function getCachedCareerRecommendations(userId) {
    try {
        // You can implement this using MongoDB or a simple cache
        // For now, we'll use a simple in-memory cache
        if (global.careerCache && global.careerCache[userId]) {
            const cached = global.careerCache[userId];
            const cacheAge = Date.now() - new Date(cached.cachedAt).getTime();
            
            // Cache is valid for 24 hours or until skills change
            if (cacheAge < 24 * 60 * 60 * 1000) {
                return cached.recommendations;
            }
        }
        return null;
    } catch (error) {
        console.error('Error getting cached recommendations:', error);
        return null;
    }
}

// Helper function to cache recommendations
async function cacheCareerRecommendations(userId, recommendations, skillsHash) {
    try {
        if (!global.careerCache) {
            global.careerCache = {};
        }
        
        global.careerCache[userId] = {
            recommendations,
            skillsHash,
            cachedAt: new Date().toISOString()
        };
        
        console.log(`Cached career recommendations for user ${userId}`);
    } catch (error) {
        console.error('Error caching recommendations:', error);
    }
}



