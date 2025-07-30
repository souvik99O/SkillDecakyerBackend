const firebaseAdmin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const users = require("../model/user");
const Users = users.User;
const jwt = require("jsonwebtoken");

const authController = require("../controller/authController");


const secretKey = process.env.SECRETJWT;

router

      .post("/",authController.login)

      .get("/",async (req,res)=>{
        const user= await Users.findOne({phone:req.user.phone});
        const userData=JSON.parse(JSON.stringify(user));
        const userPhone=userData.phone;
        res.render("dashboard", { userPhone : userPhone});

      });






//     router.patch('/',async (req,res)=>
//      {
//           const phone = req.body.phone;
//           const user = await Users.findOne({phone:phone});
//           if(user)
//           {
//                user.lastLogin=Date.now();
//                user.save();
//                res.send({message:"User updated successfully"});
//           }
//           else
//           {
//                res.send({message:"User does not exist"});
//           }
//      });

exports.router = router;
