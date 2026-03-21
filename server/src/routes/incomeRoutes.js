const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  createIncome,
  listIncomes,
  deleteIncome
} = require("../controllers/incomeController");

const router = express.Router();

router.use(requireAuth);

router.post("/", createIncome); // POST /api/income
router.get("/", listIncomes); // GET /api/income
router.delete("/:id", deleteIncome); // DELETE /api/income/:id

module.exports = router;

