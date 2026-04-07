const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = reservationSchema;