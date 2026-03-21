function xpFromAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  // Simple rule: 1 XP per 1 (floor) amount
  return Math.max(0, Math.floor(n));
}

function levelFromXP(xp) {
  const n = Number(xp);
  if (!Number.isFinite(n) || n < 0) return 1;
  // Every 100 XP => next level
  return Math.floor(n / 100) + 1;
}

module.exports = { xpFromAmount, levelFromXP };

