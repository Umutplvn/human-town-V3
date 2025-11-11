"use strict";

const Mail = require("../models/mail");

module.exports = {
  createMail: async (req, res) => {
    try {
      const from = req.userId;
      const { to, cc, bcc, subject, message, attachments, draft, deletable } = req.body;

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
      });

      res.status(201).json({ error: false, mail });
    } catch (err) {
      console.error("Create Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to create mail." });
    }
  },

  getMails: async (req, res) => {
    try {
      const userId = req.userId;
      const folder = req.query.folder || "inbox";

      const filter =
        folder === "sent"
          ? { from: userId, folder }
          : { to: userId, folder };

      const mails = await Mail.find(filter)
        .populate("from to cc bcc", "name email")
        .sort({ createdAt: -1 });

      res.json({ error: false, mails });
    } catch (err) {
      console.error("Get Mails Error:", err);
      res.status(500).json({ error: true, message: "Failed to fetch mails." });
    }
  },

  getMailById: async (req, res) => {
    try {
      const { id } = req.params;
      const mail = await Mail.findById(id).populate("from to cc bcc", "name email");

      if (!mail) return res.status(404).json({ error: true, message: "Mail not found." });

      if (!mail.isRead && mail.to.map(x => x.toString()).includes(req.userId)) {
        mail.isRead = true;
        await mail.save();
      }

      res.json({ error: false, mail });
    } catch (err) {
      console.error("Get Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to fetch mail." });
    }
  },

  replyMail: async (req, res) => {
    try {
      const { originalMailId, message } = req.body;
      const from = req.userId;

      const original = await Mail.findById(originalMailId);
      if (!original) return res.status(404).json({ error: true, message: "Original mail not found." });

      const reply = await Mail.create({
        from,
        to: [original.from],
        subject: `Re: ${original.subject}`,
        message,
        folder: "sent",
      });

      res.status(201).json({ error: false, reply });
    } catch (err) {
      console.error("Reply Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to reply mail." });
    }
  },

  forwardMail: async (req, res) => {
    try {
      const { originalMailId, to, message } = req.body;
      const from = req.userId;

      const original = await Mail.findById(originalMailId);
      if (!original) return res.status(404).json({ error: true, message: "Original mail not found." });

      const forward = await Mail.create({
        from,
        to,
        subject: `Fwd: ${original.subject}`,
        message: `${message || ""}\n\n--- Forwarded message ---\n${original.message}`,
        folder: "sent",
      });

      res.status(201).json({ error: false, forward });
    } catch (err) {
      console.error("Forward Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to forward mail." });
    }
  },

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
        return res.status(403).json({ error: true, message: "You are not allowed to delete this mail." });
      }

      if (mail.folder === "trash" || mail.deletable) {
        await mail.deleteOne();
        return res.json({ error: false, message: "Mail permanently deleted." });
      }

      mail.folder = "trash";
      await mail.save();
      res.json({ error: false, message: "Mail moved to trash." });
    } catch (err) {
      console.error("Delete Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to delete mail." });
    }
  },

  deleteMailBothSides: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const mail = await Mail.findById(id);
      if (!mail) return res.status(404).json({ error: true, message: "Mail not found." });

      if (mail.from.toString() !== userId) {
        return res.status(403).json({ error: true, message: "Only sender can delete from both sides." });
      }

      if (!mail.deletable) {
        return res.status(400).json({ error: true, message: "Mail is not deletable from both sides." });
      }

      await Mail.deleteOne({ _id: id });
      res.json({ error: false, message: "Mail deleted from both sides." });
    } catch (err) {
      console.error("Delete Both Sides Error:", err);
      res.status(500).json({ error: true, message: "Failed to delete mail from both sides." });
    }
  },
};
