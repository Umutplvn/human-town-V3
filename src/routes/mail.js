"use strict";

const express = require("express");
const router = express.Router();
const mailController = require("../controllers/mailController");


// CREATE & DRAFT
router.post("/", mailController.createMail);

// READ
router.get("/", mailController.getMails);
router.get("/:id", mailController.getMailById);

// REPLY & FORWARD
router.post("/reply", mailController.replyMail);
router.post("/forward", mailController.forwardMail);

// DELETE
router.delete("/:id", mailController.deleteMail);
router.delete("/:id/both", mailController.deleteMailBothSides);

module.exports = router;
