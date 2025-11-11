"use strict";

const mongoose = require("mongoose");

const MailSchema = new mongoose.Schema(
  {
    from: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Admin", 
      required: true 
    },

    to: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
    ],

    cc: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
    ],

    bcc: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
    ],

    subject: { 
      type: String, 
      required: true, 
      trim: true 
    },

    message: { 
      type: String, 
      required: true 
    },

    attachments: [
      {
        filename: String,
        url: String, 
        size: Number,
        mimetype: String,
      }
    ],

    isRead: { 
      type: Boolean, 
      default: false 
    },

    isStarred: { 
      type: Boolean, 
      default: false 
    },

    isDeleted: { 
      type: Boolean, 
      default: false 
    },

    folder: { 
      type: String, 
      enum: ["inbox", "sent", "draft", "trash", "spam", "archive"], 
      default: "inbox" 
    },

    draft: {
      type: Boolean,
      default: false
    },

    deletable: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mail", MailSchema);
