var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var CamperSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

CamperSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Camper", CamperSchema);
