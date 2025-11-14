"use strict";

const express = require("express");
const router = express.Router();
const mailController = require("../controllers/mail");


// CREATE & DRAFT
router.post("/", mailController.createMail);

// READ
router.get("/", mailController.getMails);
router.get("/mail/:id", mailController.getMailById);
router.get("/thread/:threadId", mailController.getThreadMails);

// REPLY & FORWARD
router.post("/reply", mailController.replyMail);
router.post("/forward", mailController.forwardMail);

// DELETE - RESTORE
router.delete("/del/:id", mailController.deleteMail);
router.post("/restore/:id", mailController.restoreMail);
router.delete("/del/:id/both", mailController.deleteMailBothSides);

module.exports = router;
