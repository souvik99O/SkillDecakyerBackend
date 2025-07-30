const express = require("express");
const { startSkillDecayScheduler } = require('./jobs/skillDecayJob.js');
const path = require('path');
require("dotenv").config();
const mongoose = require("mongoose");
const server=express();
const authRouter = require("./Routes/auth.js");
const skillRouter = require("./Routes/skills.js");
const cors = require('cors');
server.use(express.json());
let ejs = require('ejs');
const jwt = require("jsonwebtoken");
server.set('view engine', 'ejs');


const corsOptions = {
  origin: '*', // allow requests from this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // allow these methods
  allowedHeaders: ['Content-Type', 'Authorization'], // allow these headers
  maxAge: 3600, // set the max age for CORS configuration
};

server.use(cors(corsOptions)); 
//db connection---------------------------------------
const uri = `mongodb+srv://souvikwork99:${encodeURIComponent(process.env.DB_PASSWORD)}%23@cluster0.xkodemu.mongodb.net/SkillDecayer?retryWrites=true&w=majority`;
async function run() {
  
    try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("DATABASE CONNECTED!");
  } 
  catch (e) {
    console.error(e);
  }
}
run().catch(console.dir);

//db connection---------------------------------------


//middleWares-----------------------------------------
server.use(express.static(path.join(__dirname, '../AppFrontend/html')));


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




const firebaseAdmin = require("firebase-admin");
const adminDetails = require("./Routes/firebase-admin.json");
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(adminDetails),
});

//middleWares-----------------------------------------


//api endpoints-------------------------------------

server.use("/api/auth/firebaseLogin", authRouter.router);
server.use("/api/skills", skillRouter.router);

//api endpoints-------------------------------------











startSkillDecayScheduler();
server.listen(8080, () => {
    console.log("server started along with skill decay monitor");
});