const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    // Format: YYYY-MM (local time)
    month: { type: String, required: true, trim: true, index: true },
    limit: { type: Number, required: true, min: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }
  },
  { timestamps: true }
);

// One budget limit per user per month.
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);

