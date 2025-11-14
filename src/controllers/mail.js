"use strict";

const mongoose = require("mongoose");
const Mail = require("../models/mail");
const MailUser = require("../models/mailUser");

module.exports = {
  // ------------------- CREATE / SEND MAIL -------------------
  createMail: async (req, res) => {
    try {
      const from = req.userId;
      const {
        to,
        cc = [],
        bcc = [],
        subject,
        message,
        attachments = [],
        draft,
        deletable,
        replyTo,
      } = req.body;

      if (!draft && (!to || to.length === 0)) {
        return res
          .status(400)
          .json({ error: true, message: "Recipient is required." });
      }

      // Thread ID
      let threadId = new mongoose.Types.ObjectId();
      if (replyTo) {
        const original = await Mail.findById(replyTo);
        if (!original)
          return res
            .status(404)
            .json({ error: true, message: "Original mail not found." });
        threadId = original.threadId;
      }

      // Mail kaydı oluştur
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
        threadId,
      });

      // Gönderen MailUser
      await MailUser.create({
        mailId: mail._id,
        userId: from,
        folder: draft ? "draft" : "sent",
        isRead: true,
      });

      // Alıcı MailUser
      const recipients = [...to, ...cc, ...bcc];
      const mailUsers = recipients.map((userId) => ({
        mailId: mail._id,
        userId,
        folder: "inbox",
        isRead: false,
      }));
      if (mailUsers.length > 0) await MailUser.insertMany(mailUsers);

      res.status(201).json({ error: false, mail });
    } catch (err) {
      console.error("Create Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to create mail." });
    }
  },

  // ------------------- GET MAILS BY USER & FOLDER -------------------
  getMails: async (req, res) => {
    try {
      const userId = req.userId;
      const folder = req.query.folder || "inbox";

      const mailUsers = await MailUser.find({ userId, folder })
        .populate({
          path: "mailId",
          populate: { path: "from to cc bcc", select: "name email" },
        })
        .sort({ createdAt: -1 });

      const mails = mailUsers.map((mu) => {
        return {
          ...mu.mailId.toObject(),
          folder: mu.folder,
          isRead: mu.isRead,
        };
      });

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
      const userId = req.userId;

      const mailUser = await MailUser.findOne({ mailId: id, userId }).populate({
        path: "mailId",
        populate: "from to cc bcc",
        select: "name email",
      });

      if (!mailUser)
        return res
          .status(404)
          .json({ error: true, message: "Mail not found." });

      // Okundu işareti
      if (!mailUser.isRead && mailUser.folder !== "sent") {
        mailUser.isRead = true;
        await mailUser.save();
      }

      const mail = {
        ...mailUser.mailId.toObject(),
        folder: mailUser.folder,
        isRead: mailUser.isRead,
      };
      res.json({ error: false, mail });
    } catch (err) {
      console.error("Get Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to fetch mail." });
    }
  },

  // ------------------- GET THREAD -------------------
  getThreadMails: async (req, res) => {
    try {
      const { threadId } = req.params;
      const userId = req.userId;

      const mailUsers = await MailUser.find({
        userId,
        mailId: { $in: await Mail.find({ threadId }).distinct("_id") },
      })
        .populate({
          path: "mailId",
          populate: "from to cc bcc",
          select: "name email",
        })
        .sort({ createdAt: 1 });

      const mails = mailUsers.map((mu) => ({
        ...mu.mailId.toObject(),
        folder: mu.folder,
        isRead: mu.isRead,
      }));
      res.json({ error: false, mails });
    } catch (err) {
      console.error("Get Thread Mails Error:", err);
      res
        .status(500)
        .json({ error: true, message: "Failed to fetch thread mails." });
    }
  },

  // ------------------- REPLY MAIL -------------------
  replyMail: async (req, res) => {
    try {
      const { originalMailId, message } = req.body;
      const from = req.userId;

      const original = await Mail.findById(originalMailId);
      if (!original)
        return res
          .status(404)
          .json({ error: true, message: "Original mail not found." });

      const reply = await Mail.create({
        from,
        to: [original.from],
        subject: `Re: ${original.subject}`,
        message,
        folder: "sent",
        threadId: original.threadId,
      });

      await MailUser.create({
        mailId: reply._id,
        userId: from,
        folder: "sent",
        isRead: true,
      });

      await MailUser.create({
        mailId: reply._id,
        userId: original.from,
        folder: "inbox",
        isRead: false,
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
        return res
          .status(404)
          .json({ error: true, message: "Original mail not found." });

      const forward = await Mail.create({
        from,
        to,
        subject: `Fwd: ${original.subject}`,
        message: `${message || ""}\n\n--- Forwarded message ---\n${
          original.message
        }`,
        folder: "sent",
        threadId: new mongoose.Types.ObjectId(),
      });

      // Gönderen MailUser
      await MailUser.create({
        mailId: forward._id,
        userId: from,
        folder: "sent",
        isRead: true,
      });

      // Alıcı MailUser
      const mailUsers = to.map((userId) => ({
        mailId: forward._id,
        userId,
        folder: "inbox",
        isRead: false,
      }));
      if (mailUsers.length > 0) await MailUser.insertMany(mailUsers);

      res.status(201).json({ error: false, forward });
    } catch (err) {
      console.error("Forward Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to forward mail." });
    }
  },

  // ------------------- DELETE MAIL (TRASH FIRST) -------------------
  deleteMail: async (req, res) => {
    try {
      const { id } = req.params; // mailId
      const userId = req.userId;

      const mailUser = await MailUser.findOne({ mailId: id, userId });
      if (!mailUser)
        return res
          .status(404)
          .json({ error: true, message: "Mail not found for this user." });

      if (mailUser.folder === "trash") {
        return res.json({ error: false, message: "Mail already in trash." });
      }

      // Eğer deletable ise kalıcı sil
      if (mailUser.deletable) {
        await MailUser.deleteOne({ _id: mailUser._id });
        return res.json({ error: false, message: "Mail permanently deleted." });
      }

      // trash’a taşı
      mailUser.previousFolder = mailUser.folder;
      mailUser.folder = "trash";
      mailUser.deletedAt = new Date();
      await mailUser.save();

      res.json({ error: false, message: "Mail moved to trash." });
    } catch (err) {
      console.error("Delete Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to delete mail." });
    }
  },

  // ------------------- RESTORE MAIL -------------------
  restoreMail: async (req, res) => {
    try {
      const { id } = req.params; // mailId
      const userId = req.userId;

      const mailUser = await MailUser.findOne({ mailId: id, userId });
      if (!mailUser)
        return res
          .status(404)
          .json({ error: true, message: "Mail not found for this user." });

      if (!mailUser.previousFolder)
        return res
          .status(400)
          .json({
            error: true,
            message: "Cannot restore mail; previous folder unknown.",
          });

      mailUser.folder = mailUser.previousFolder;
      mailUser.previousFolder = null;
      mailUser.deletedAt = null;
      await mailUser.save();

      res.json({ error: false, message: "Mail restored.", mailUser });
    } catch (err) {
      console.error("Restore Mail Error:", err);
      res.status(500).json({ error: true, message: "Failed to restore mail." });
    }
  },

  // ------------------- DELETE FROM BOTH SIDES -------------------
  deleteMailBothSides: async (req, res) => {
    try {
      const { id } = req.params; // mailId
      const userId = req.userId;

      const mail = await Mail.findById(id);
      if (!mail)
        return res
          .status(404)
          .json({ error: true, message: "Mail not found." });

      if (mail.from.toString() !== userId)
        return res
          .status(403)
          .json({
            error: true,
            message: "Only sender can delete from both sides.",
          });

      // MailUser kayıtlarını kontrol et
      const mailUsers = await MailUser.find({ mailId: id });

      const notDeletable = mailUsers.some((mu) => !mu.deletable);
      if (notDeletable)
        return res
          .status(400)
          .json({
            error: true,
            message:
              "Mail not deletable for both sides; you can only delete your copy.",
          });

      await MailUser.deleteMany({ mailId: id });
      await Mail.deleteOne({ _id: id });

      res.json({ error: false, message: "Mail deleted from both sides." });
    } catch (err) {
      console.error("Delete Both Sides Error:", err);
      res
        .status(500)
        .json({
          error: true,
          message: "Failed to delete mail from both sides.",
        });
    }
  },
};
