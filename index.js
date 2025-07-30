const express = require("express");
const { startSkillDecayScheduler } = require('./jobs/skillDecayJob.js');
const path = require('path');
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require('cors');
const jwt = require("jsonwebtoken");
let ejs = require('ejs');

const server = express();
const authRouter = require("./Routes/auth.js");
const skillRouter = require("./Routes/skills.js");

// Firebase Admin initialization from env variable
const firebaseAdmin = require("firebase-admin");

try {
  // Parse and load Firebase Admin SDK credentials from environment variable
const firebaseAdmin = require('firebase-admin');
let serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');  // fix newlines

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});
}
catch (e) {
  console.error("Failed to initialize Firebase Admin SDK:", e);
  process.exit(1);  // Stop server if Firebase Admin fails
}


// Middleware configuration
server.use(express.json());
server.set('view engine', 'ejs');

// CORS configuration - please set your frontend URL in production
const corsOptions = {
  origin: '*', // For production, replace '*' with frontend URL like 'https://yourfrontend.netlify.app'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
};
server.use(cors(corsOptions));

// Static files for frontend (adjust path as per structure)
server.use(express.static(path.join(__dirname, '../AppFrontend/html')));

// MongoDB connection
const uri = `mongodb+srv://souvikwork99:${encodeURIComponent(process.env.DB_PASSWORD)}%23@cluster0.xkodemu.mongodb.net/SkillDecayer?retryWrites=true&w=majority`;
async function run() {
  try {
    await mongoose.connect(uri);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("DATABASE CONNECTED!");
  }
  catch (e) {
    console.error(e);
  }
}
run().catch(console.dir);

// JWT protection middlewares (left unchanged)
function protect(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token){
    console.log("token not found");
    return res.redirect("/index.html");
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRETJWT);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.redirect("index.html");
  }
}

function protectOtherPages(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token);
  if (!token){
    console.log("token not found");
    return res.sendStatus(401);
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRETJWT);
    req.userId = decoded.userId;
    console.log(req.userId);
    next();
  } catch (err) {
    return res.send(err);
  }
}

// Router mounts
server.use("/api/auth/firebaseLogin", authRouter.router);
server.use("/api/skills", skillRouter.router);

// Start any scheduled jobs
startSkillDecayScheduler();

// Start server
server.listen(8080, () => {
  console.log("server started along with skill decay monitor");
});
