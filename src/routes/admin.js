"use strict";

const express = require("express");
const router = express.Router();

const Admin = require("../controllers/admin");

// ---------------- ROUTES ----------------

router.post("/create", Admin.create);
router.get("/:userId", Admin.read);
router.put("/:userId", Admin.update);
router.delete("/:userId", Admin.deleteUser);

module.exports = router;
