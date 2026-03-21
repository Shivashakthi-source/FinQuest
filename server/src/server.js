const app = require("./app");
const { connectDB } = require("./config/db");
const { seedIfEmpty } = require("./seed/seed");

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedIfEmpty();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`FinQuest server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Server failed to start:", err);
  process.exit(1);
});

