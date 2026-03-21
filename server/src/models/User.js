const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    xp: { type: Number, required: true, default: 0, min: 0 },
    level: { type: Number, required: true, default: 1, min: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

