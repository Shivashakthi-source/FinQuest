const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { getCurrentBudget, upsertCurrentBudget } = require("../controllers/budgetController");

const router = express.Router();

router.use(requireAuth);

router.get("/current", getCurrentBudget);
router.post("/current", upsertCurrentBudget);

module.exports = router;

