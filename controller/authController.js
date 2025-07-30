const users = require("../model/user");
const Users = users.User;
const firebaseAdmin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRETJWT;
 
 
 exports.login = async (req, res) => {
    const idToken = req.body.idToken;
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    try {
      // 1. Verify Firebase ID token
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const phone = decodedToken.phone_number;
      const uid = req.body.uid;

      if (!phone) {
        return res.status(400).json({ error: "Phone number missing in token" });
      }

      // 2. Find or create user
      let user = await Users.findOne({ phone });

      if (!user) {
        user = new Users({ phone, firebasetoken: idToken , userId: uid });
        await user.save();
      }

      // 3. Generate JWT with MongoDB _id, not Firebase uid
      const jwtToken = jwt.sign({ userId: user._id }, secretKey, {
        expiresIn: "7d",
      });

      // 4. Optionally save JWT to user (debug/admin use)
      user.jwttoken = jwtToken;
      await user.save();

      // 5. Send final response
      return res.status(200).json({
        message: "Login successful",
        token: jwtToken,
        user: {
          id: user._id,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ error: "Invalid Firebase token" });
    }
  }
