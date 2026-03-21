const express = require("express");
const { register, login, me, logout } = require("../controllers/userController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

module.exports = router;

