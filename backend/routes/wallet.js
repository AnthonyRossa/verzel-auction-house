const express = require("express");
const authenticateToken = require("../middleware/auth");

module.exports = (pool) => {
  const router = express.Router();

  async function getBalance(userId) {
    const result = await pool.query(
      `SELECT
         u.balance AS total_balance,
         COALESCE(reservations.committed_balance, 0) AS committed_balance,
         u.balance - COALESCE(reservations.committed_balance, 0)
           AS available_balance
       FROM users u
       LEFT JOIN LATERAL (
         SELECT SUM(user_leads.amount) AS committed_balance
         FROM (
           SELECT b.auction_id, MAX(b.amount) AS amount
           FROM bids b
           JOIN auctions a ON a.id = b.auction_id
           WHERE b.bidder_id = u.id
             AND a.ends_at > NOW()
           GROUP BY b.auction_id
         ) user_leads
         WHERE user_leads.amount = (
           SELECT MAX(all_bids.amount)
           FROM bids all_bids
           WHERE all_bids.auction_id = user_leads.auction_id
         )
       ) reservations ON TRUE
       WHERE u.id = $1`,
      [userId],
    );

    return result.rows[0];
  }

  router.get("/", authenticateToken, async (req, res) => {
    try {
      const balance = await getBalance(req.userId);

      if (!balance) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(balance);
    } catch (error) {
      console.error("Failed to fetch wallet balance", error);
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  router.post("/top-up", authenticateToken, async (req, res) => {
    const { amount } = req.body ?? {};

    if (
      typeof amount !== "string" ||
      !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount) ||
      Number(amount) <= 0 ||
      Number(amount) > 1_000_000
    ) {
      return res.status(400).json({ error: "Enter an amount from $0.01 to $1,000,000" });
    }

    try {
      const result = await pool.query(
        `UPDATE users
         SET balance = balance + $1::numeric
         WHERE id = $2
         RETURNING id`,
        [amount, req.userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(await getBalance(req.userId));
    } catch (error) {
      console.error("Failed to add demo balance", error);
      res.status(500).json({ error: "Failed to add balance" });
    }
  });

  return router;
};