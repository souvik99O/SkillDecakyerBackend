// Routes/skills.js - FIXED ROUTES
const express = require("express");
const router = express.Router();
const skills = require("../model/skill");
const Skills = skills.Skills;
const jwt = require("jsonwebtoken");
const skillController = require("../controller/skillController");
const secretKey = process.env.SECRETJWT;

router
.post("/log", skillController.logskill)                            // POST /api/skills/log
.get("/getAllSkills/:id", skillController.getSkillsWithDecay)      // GET /api/skills/getAllSkills/:id-->this returns all skills with Decay
.post("/updateSkill/:id", skillController.updateSkill)             // POST /api/skills/updateSkill/:id     
.post('/trigger-decay', skillController.triggerDecayCalculation)  // POST /api/skills/trigger-decay
.delete('/delete/:skillId/:userId', skillController.deleteSkill) // DELETE /api/skills/delete/:skillId/:userId 
.get("/career-recommendations/:id", skillController.getCareerRecommendations); // GET /api/skills/career-recommendations/:id


exports.router = router;
