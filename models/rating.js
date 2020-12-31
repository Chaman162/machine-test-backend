const mongoose = require('mongoose'),
    Schema = mongoose.Schema,

    Rating = new Schema({
        user_id: { type: mongoose.Schema.ObjectId, ref: 'User' },
        post_id: { type: mongoose.Schema.ObjectId, ref: 'Post' },
        rate: { type: Number, required: true },
        comment: { type: String, sparse: true },
        is_blocked: { type: Boolean, default: false },
        is_deleted: { type: Boolean, default: false },
        created_on: { type: Date, default: Date.now() },
    }, { timestamp: true });

module.exports = mongoose.model('Rating', Rating)
