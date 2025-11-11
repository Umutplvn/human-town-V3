const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  token: { type: String, required: true, trim: true }
}, { collection: 'token', timestamps: true });

module.exports = mongoose.model("Token", tokenSchema);