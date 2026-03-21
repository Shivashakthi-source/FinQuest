const bcrypt = require("bcryptjs");
const User = require("../models/User");

function getSaltRounds() {
  const raw = process.env.BCRYPT_SALT_ROUNDS;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 10;
}

function safeUserResponse(user) {
  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    xp: user.xp,
    level: user.level
  };
}

async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email, and password are required." });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedName = String(name).trim();
  const plainPassword = String(password);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: "User already exists." });
  }

  const hashedPassword = await bcrypt.hash(plainPassword, getSaltRounds());

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
    xp: 0,
    level: 1
  });

  req.session.userId = user._id;

  return res.status(201).json(safeUserResponse(user));
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required." });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const plainPassword = String(password);

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    return res.status(404).json({ message: "User not found. Register first." });
  }

  if (!user.password) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const isValid = await bcrypt.compare(plainPassword, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  req.session.userId = user._id;
  return res.json(safeUserResponse(user));
}

async function me(req, res) {
  const { userId } = req.session || {};
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(401).json({ message: "Unauthorized." });

  return res.json(safeUserResponse(user));
}

async function logout(req, res) {
  if (!req.session) return res.status(204).send();

  req.session.destroy((err) => {
    const cookieName = process.env.SESSION_COOKIE_NAME || "finquest.sid";
    res.clearCookie(cookieName);
    if (err) return res.status(500).json({ message: "Failed to logout." });
    return res.status(204).send();
  });
}

module.exports = { register, login, me, logout };

