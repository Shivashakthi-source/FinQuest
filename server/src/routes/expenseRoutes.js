const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  createExpense,
  listExpenses,
  updateExpense,
  deleteExpense
} = require("../controllers/expenseController");

const router = express.Router();

router.use(requireAuth);

router.post("/", createExpense); // POST /api/expenses
router.get("/", listExpenses); // GET /api/expenses
router.put("/:id", updateExpense); // PUT /api/expenses/:id
router.delete("/:id", deleteExpense); // DELETE /api/expenses/:id

module.exports = router;

