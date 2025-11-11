"use strict"
/* -------------------------------------------------------
    EXPRESSJS - Human Town Project with Mongoose
------------------------------------------------------- */

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB)
    .then(() => console.log(' * DB Connected * '))
    .catch((err) => console.log(' * DB Not Connected * ', err))