const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { getStats } = require("../controllers/statsController");

const router = express.Router();
router.use(requireAuth);

// GET /api/stats
router.get("/", getStats);

module.exports = router;

