'use strict';

const mongoose = require('mongoose');

const TicketSchema = mongoose.Schema({
    _id: { type: String, required: true, unique: true },
    issuedAt: { type: Date, required: true },
    closedAt: { type: Date },
    stayTime: { type: Number },
    timeUnits: { type: String },
    receiptId: { type: String },
    currency: { type: String },
    stayAmount: { type: Number },
    tax: { type: Number },
    discount: { type: Number },
    total: { type: Number },
    username: { type: String }
});

module.exports = mongoose.model('Ticket', TicketSchema);