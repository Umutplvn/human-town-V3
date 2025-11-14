"use strict";

const mongoose = require("mongoose");

const MailUserSchema = new mongoose.Schema(
  {
    mailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mail",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    folder: {
      type: String,
      enum: ["inbox", "sent", "draft", "trash", "spam", "archive"],
      required: true,
    },
    previousFolder: {
      type: String,
      enum: ["inbox", "sent", "draft", "trash", "spam", "archive"],
      default: null,
    },
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    deletable: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null, index: { expireAfterSeconds: 3 * 24 * 60 * 60 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MailUser", MailUserSchema);
