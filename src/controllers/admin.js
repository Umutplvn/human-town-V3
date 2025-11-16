"use strict";

const Admin = require("../models/admin");
const passwordEncrypt = require("../helpers/passwordEncrypt");
const Token = require("../models/token");

// --------------------- Controller ---------------------
module.exports = {
    create: async (req, res) => {
      try {
        const { name, email, password } = req.body;
  
        if (!name || !email || !password) {
          return res.status(400).json({ error: true, message: "All fields are required!" });
        }
        if (!email.endsWith("@human.town")) {
          return res.status(400).json({ error: true, message: "Email is not valid!" });
        }
  
        const existingUser = await Admin.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: true, message: "This email address is already in use!" });
        }
        const data = await Admin.create({
          name,
          email,
          password: passwordEncrypt(password),
        });
  
        const tokenString = "Token " + passwordEncrypt(data._id + `${new Date()}`);
        await Token.create({ userId: data._id, token: tokenString });
  
        res.status(201).json({
          error: false,
          user: data,
          Token: tokenString,
        });
  
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: "Failed!" });
      }
    },
  

  // ---------------- Read User ----------------
  read: async (req, res) => {
    const userId = req.params.userId
    try {
      const user = await Admin.findById(userId).select("-password");
      res.json({ error: false, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: "Can't fetch the user data." });
    }
  },

  // ---------------- UPDATE USER ----------------
  update: async (req, res) => {
    try {
      const { userId } = req.params;
      const { name, email, avatar } = req.body;

      const user = await Admin.findByIdAndUpdate(
        userId,
        { name, email, avatar },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) return res.status(404).json({ error: true, message: "User not found!" });
      res.json({ error: false, message: "User updated successfully!", user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: "Failed to update user." });
    }
  },


  // ---------------- Delete User ----------------
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;
      await Admin.deleteOne({ _id: userId });
      await Token.deleteOne({userId})
      res.json({ error: false, message: "Account deleted!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: "Failed!" });
    }
  },


};