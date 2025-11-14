"use strict";

const express = require("express");
const router = express.Router();
const mailController = require("../controllers/mail");

// ------------------- Mail Routes -------------------

// Create / Send mail
router.post("/create", mailController.createMail);

// Get mails by folder (inbox, sent, draft, trash, spam, archive)
router.get("/", mailController.getMails);

// Get single mail by id
router.get("/:id", mailController.getMailById);

// Get mails by thread
router.get("/thread/:threadId", mailController.getThreadMails);

// Reply to mail
router.post("/reply", mailController.replyMail);

// Forward mail
router.post("/forward", mailController.forwardMail);

// Delete mail (move to trash or permanently)
router.delete("/delete/:id", mailController.deleteMail);

// Restore mail from trash
router.post("/restore/:id", mailController.restoreMail);

// Delete mail from both sides (sender only)
router.delete("/:id/both", mailController.deleteMailBothSides);

module.exports = router;
