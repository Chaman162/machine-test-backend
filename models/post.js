const mongoose = require('mongoose'),
    Schema = mongoose.Schema,

    Post = new Schema({
        name: { type: String, required: true },
        is_blocked: { type: Boolean, default: false },
        is_deleted: { type: Boolean, default: false },
        created_on: { type: Date, default: Date.now() },
    }, { timestamp: true });

module.exports = mongoose.model('Post', Post)
