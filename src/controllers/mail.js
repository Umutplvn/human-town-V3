"use strict";

const mongoose = require("mongoose");
const Mail = require("../models/mail");

module.exports = {

  // ------------------- CREATE / SEND MAIL -------------------
  createMail: async (req, res) => {
    try {
      const from = req.userId;
      const { to, cc, bcc, subject, message, attachments, draft, deletable, replyTo } = req.body;

      let threadId = undefined;

      if (replyTo) {
        const original = await Mail.findById(replyTo);
        if (!original)
          return res.status(404).json({ error: true, message: "Original mail not found." });

        threadId = original.threadId;
      }

      if (!draft && (!to || to.length === 0)) {
        return res.status(400).json({ error: true, message: "Recipient is required." });
      }

      const mail = await Mail.create({
        from,
        to,
        cc,
        bcc,
        subject,
        message,
        attachments,
        deletable: deletable || false,
        draft: draft || false,
        folder: draft ? "draft" : "sent",
        threadId // reply değilse default üretilecek
      });

      res.status(201).json({ error: false, mail });
    } catch (err) {
      console.error("Create Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to create mail." });
    }
  },

  // ------------------- LIST MAILS BY FOLDER -------------------
  getMails: async (req, res) => {
    try {
      const userId = req.userId;
      const folder = req.query.folder || "inbox";

      let filter = { folder };

      if (folder === "sent") {
        filter.from = userId;
      } else {
        filter.$or = [
          { to: userId },
          { cc: userId },
          { bcc: userId }
        ];
      }

      const mails = await Mail.find(filter)
        .populate("from to cc bcc", "name email")
        .sort({ createdAt: -1 });

      res.json({ error: false, mails });
    } catch (err) {
      console.error("Get Mails Error:", err);
      res.status(500).json({ error: true, message: "Failed to fetch mails." });
    }
  },

  // ------------------- GET SINGLE MAIL -------------------
  getMailById: async (req, res) => {
    try {
      const { id } = req.params;

      const mail = await Mail.findById(id)
        .populate("from to cc bcc", "name email");

      if (!mail)
        return res.status(404).json({ error: true, message: "Mail not found." });

      // Mark as read ONLY if user is a recipient (not sender)
      if (!mail.isRead) {
        const recipients = [...mail.to, ...mail.cc];
        if (recipients.map(r => r._id.toString()).includes(req.userId)) {
          mail.isRead = true;
          await mail.save();
        }
      }

      res.json({ error: false, mail });
    } catch (err) {
      console.error("Get Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to fetch mail." });
    }
  },

  getThreadMails: async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.userId;

    const mails = await Mail.find({
      threadId,
      $or: [
        { from: userId },
        { to: userId },
        { cc: userId },
        { bcc: userId }
      ]
    })
      .populate("from to cc bcc", "name email")
      .sort({ createdAt: 1 }); 

    if (!mails || mails.length === 0)
      return res.status(404).json({ error: true, message: "No mails in this thread." });

    res.json({ error: false, mails });
  } catch (err) {
    console.error("Get Thread Mails Error:", err);
    res.status(500).json({ error: true, message: "Failed to fetch thread mails." });
  }
},

  // ------------------- REPLY MAIL -------------------
  replyMail: async (req, res) => {
    try {
      const { originalMailId, message } = req.body;
      const from = req.userId;

      const original = await Mail.findById(originalMailId);
      if (!original)
        return res.status(404).json({ error: true, message: "Original mail not found." });

      const reply = await Mail.create({
        from,
        to: [original.from],
        subject: `Re: ${original.subject}`,
        message,
        folder: "sent",
        threadId: original.threadId
      });

      res.status(201).json({ error: false, reply });
    } catch (err) {
      console.error("Reply Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to reply mail." });
    }
  },

  // ------------------- FORWARD MAIL -------------------
forwardMail: async (req, res) => {
  try {
    const { originalMailId, to, message } = req.body;
    const from = req.userId;

    const original = await Mail.findById(originalMailId);
    if (!original)
      return res.status(404).json({ error: true, message: "Original mail not found." });

    const forward = await Mail.create({
      from,
      to,
      subject: `Fwd: ${original.subject}`,
      message: `${message || ""}\n\n--- Forwarded message ---\n${original.message}`,
      folder: "sent",
  threadId: new mongoose.Types.ObjectId()
    });

    res.status(201).json({ error: false, forward });
  } catch (err) {
    console.error("Forward Mail Error:", err);
    res.status(500).json({ error: true, message: "Failed to forward mail." });
  }
},

  // ------------------- DELETE (TRASH FIRST) -------------------
deleteMail: async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const mail = await Mail.findById(id);
    if (!mail) return res.status(404).json({ error: true, message: "Mail not found." });

    const isOwner =
      mail.from.toString() === userId ||
      mail.to.map(t => t.toString()).includes(userId);

    if (!isOwner) {
      return res.status(403).json({ error: true, message: "Not allowed to delete this mail." });
    }

    // Eğer deletable → kalıcı sil
    if (mail.deletable) {
      await mail.deleteOne();
      return res.json({ error: false, message: "Mail permanently deleted." });
    }

    // trash’a taşı
    if (mail.folder !== "trash") {
      mail.previousFolder = mail.folder; // eski klasörü sakla
      mail.folder = "trash";
      mail.deletedAt = new Date();       // otomatik silme için
      await mail.save();
      return res.json({ error: false, message: "Mail moved to trash." });
    }

    res.json({ error: false, message: "Mail already in trash." });

  } catch (err) {
    console.error("Delete Mail Error:", err);
    res.status(500).json({ error: true, message: "Failed to delete mail." });
  }
},

restoreMail: async (req, res) => {
  try {
    const { id } = req.params;
    const mail = await Mail.findById(id);
    if (!mail) return res.status(404).json({ error: true, message: "Mail not found." });

    if (!mail.previousFolder)
      return res.status(400).json({ error: true, message: "Cannot restore mail; previous folder unknown." });

    mail.folder = mail.previousFolder;
    mail.previousFolder = null;
    mail.deletedAt = null;
    await mail.save();
    res.json({ error: false, message: "Mail restored.", mail });
  } catch (err) {
    console.error("Restore Mail Error:", err);
    res.status(500).json({ error: true, message: "Failed to restore mail." });
  }
},



  // ------------------- DELETE FROM BOTH SIDES -------------------
  deleteMailBothSides: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const mail = await Mail.findById(id);
      if (!mail)
        return res.status(404).json({ error: true, message: "Mail not found." });

      if (mail.from.toString() !== userId)
        return res.status(403).json({ error: true, message: "Only sender can delete from both sides." });

      if (!mail.deletable)
        return res.status(400).json({ error: true, message: "Mail is not deletable by both sides." });

      await Mail.deleteOne({ _id: id });

      res.json({ error: false, message: "Mail deleted from both sides." });

    } catch (err) {
      console.error("Delete Both Sides Error:", err);
      res.status(500).json({ error: true, message: "Failed to delete mail from both sides." });
    }
  }
};
