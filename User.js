var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  name: String,
  phoneNumber : String,
  deviceToken :String,
  otherId: { type: mongoose.Schema.Types.ObjectId, ref: "other" }
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);
