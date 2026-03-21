const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Income", incomeSchema);

