"use strict";

const Admin = require("../models/admin");
const Token = require("../models/token");
const passwordEncrypt = require("../helpers/passwordEncrypt");

module.exports = {

  // ---------------- Login ----------------
  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(401).json({ error: true, message: "Email and Password required!" });

    const user = await Admin.findOne({ email, password: passwordEncrypt(password) });
    if (!user) return res.status(401).json({ error: true, message: "Wrong creadentials!" });

    // Yeni token oluştur ve eskisini silme (birden fazla cihaz için token tutma mantığı)
    const tokenString = "Token " + passwordEncrypt(user._id + `${new Date()}`);
    await Token.create({ userId: user._id, token: tokenString });
    res.status(200).json({ error: false, user, Token: tokenString });
  },

  logout: async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (token) await Token.deleteOne({ token });
      res.status(200).json({ error: false, message: "Logout successful." });
    } catch (err) {
      res.status(500).json({ error: true, message: "Logout failed!" });
    }
  }
};