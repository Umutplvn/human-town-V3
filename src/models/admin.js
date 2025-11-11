"use strict";

/* -------------------------------------------------------
    EXPRESSJS - Human Town Project
------------------------------------------------------- */

const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: { 
    type: String, 
    trim: true, 
    required: true, 
    unique: true,
   validate: {
  validator: function(v) {
    return /^[\w.-]+@human\.town$/.test(v);
  },
  message: props => `${props.value} is not a valid Human Town email!`}
},
  password: { type: String, trim: true, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);