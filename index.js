"use strict";

/* -------------------------------------------------------
   EXPRESSJS - Human Town Project
------------------------------------------------------- */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

// 🌍 Load environment variables
dotenv.config();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "http://localhost";

/* ------------------------------------------------------- */
// 🔌 Middlewares
app.use(express.json());
app.use(cors());

/* ------------------------------------------------------- */
// 🧠 Connect to MongoDB
require("./src/configs/dbConnection");

/* ------------------------------------------------------- */
// 🔐 Authorization Middleware
app.use(require("./src/middlewares/authorization"));

/* ------------------------------------------------------- */
// 🔎 Search / Sort / Pagination Middleware
app.use(require("./src/middlewares/findSearchSortPage"));

/* ------------------------------------------------------- */
// 🚦 Routes
app.use("/api/admin", require("./src/routes/admin"));
app.use("/api/auth", require("./src/routes/auth")); // <-- path sadeleştirildi
app.use("/api/mails", require("./src/routes/mail")); // <-- path sadeleştirildi

/* ------------------------------------------------------- */
// 🏠 Home Route
app.get("/", (req, res) => {
  res.status(200).send({
    error: false,
    message: "Welcome to Human Town API 🏙️",
  });
});

/* ------------------------------------------------------- */
// ❗ Error Handler Middleware
app.use(require("./src/errorHandler"));

/* ------------------------------------------------------- */
// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running at: ${HOST}:${PORT}`);
});

module.exports = app;
