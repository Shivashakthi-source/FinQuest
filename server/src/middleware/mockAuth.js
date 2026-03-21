const User = require("../models/User");

async function mockAuth(req, res, next) {
  try {
    const userId = req.header("x-user-id");
    if (!userId) {
      return res.status(401).json({ message: "Missing x-user-id header." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid user id." });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized." });
  }
}

module.exports = { mockAuth };

