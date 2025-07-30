const mongoose = require ("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    userId:
    {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    phone:
    {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        match: /^(\+91)?[6789]\d{9}$/
    },
    createdAt:
    {
        type: Date,
        default: Date.now,

    },
    lastLogin:
    {
        type: Date,
        default: Date.now,
    },
    firebasetoken:
    {
        type: String,
        required: true
    }
}) 


exports.User = mongoose.model('User', userSchema);
