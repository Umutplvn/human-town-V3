"use strict";

const Token = require("../models/token");

module.exports = async (req, res, next) => {
  req.isLogin = false;
  const authHeader = req.headers.authorization;

  const isOpenRoute =
    (req.path.startsWith("/api/auth/login") ||
      (req.path.startsWith("/api/admin/create") && req.method === "POST"));

  if (isOpenRoute) return next();

  if (!authHeader?.startsWith("Token ")) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized: Token required.",
    });
  }

  try {
    const tokenValue = authHeader.trim();
    const tokenDoc = await Token.findOne({ token: tokenValue }).populate("userId");

    if (!tokenDoc || !tokenDoc.userId) {
      return res.status(403).json({
        error: true,
        message: "Invalid or expired token.",
      });
    }

    req.isLogin = true;
    req.user = tokenDoc.userId;
    req.userId = tokenDoc.userId._id.toString();

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({
      error: true,
      message: "Authentication failed.",
    });
  }
};
