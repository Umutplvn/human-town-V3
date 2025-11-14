"use strict";

const mongoose = require("mongoose");

const MailSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    to: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],
    cc: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],
    bcc: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachments: [
      {
        filename: String,
        url: String,
        size: Number,
        mimetype: String,
      },
    ],
    draft: { type: Boolean, default: false },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mail", MailSchema);
