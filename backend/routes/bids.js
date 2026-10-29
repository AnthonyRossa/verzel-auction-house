const express = require("express");
const authenticateToken = require("../middleware/auth");

module.exports = (pool) => {
  const router = express.Router({ mergeParams: true });

  // Place a bid
  router.post("/", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body ?? {};

    if (
      !/^\d+$/.test(id) ||
      typeof amount !== "string" ||
      !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount) ||
      /^0(?:\.0{1,2})?$/.test(amount)
    ) {
      return res.status(400).json({
        error: "Invalid auction ID or bid amount",
      });
    }

    let client;
    let transactionOpen = false;

    try {
      client = await pool.connect();
      await client.query("BEGIN");
      transactionOpen = true;

      const auctionResult = await client.query(
        `SELECT id, seller_id, starting_price, (ends_at > NOW()) AS is_open
         FROM auctions
         WHERE id = $1
         FOR UPDATE`,
        [id],
      );

      const auction = auctionResult.rows[0];

      if (!auction) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(404).json({ error: "Auction not found" });
      }

      if (String(auction.seller_id) === req.userId) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(403).json({
          error: "Sellers cannot bid on their own auction",
        });
      }

      if (!auction.is_open) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(409).json({ error: "Auction has ended" });
      }

      const bidCheck = await client.query(
        `SELECT $1::numeric > GREATEST(
           $2::numeric,
           COALESCE(MAX(amount), 0)
         ) AS valid
         FROM bids
         WHERE auction_id = $3
           AND withdrawn_at IS NULL`,
        [amount, auction.starting_price, id],
      );

      if (!bidCheck.rows[0].valid) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(409).json({
          error: "Bid must exceed the current highest price",
        });
      }

      const walletResult = await client.query(
        "SELECT balance FROM users WHERE id = $1 FOR UPDATE",
        [req.userId],
      );

      if (walletResult.rows.length === 0) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(404).json({ error: "User not found" });
      }

      const reservationsResult = await client.query(
        `SELECT COALESCE(SUM(leader.amount), 0) AS committed
         FROM (
           SELECT DISTINCT ON (b.auction_id)
             b.auction_id, b.bidder_id, b.amount
           FROM bids b
           JOIN auctions a ON a.id = b.auction_id
           WHERE a.ends_at > NOW()
             AND b.auction_id <> $2
             AND b.withdrawn_at IS NULL
           ORDER BY b.auction_id, b.amount DESC, b.created_at ASC
         ) leader
         WHERE leader.bidder_id = $1`,
        [req.userId, id],
      );

      const fundsCheck = await client.query(
        `SELECT $1::numeric >= $2::numeric + $3::numeric AS sufficient`,
        [
          walletResult.rows[0].balance,
          reservationsResult.rows[0].committed,
          amount,
        ],
      );

      if (!fundsCheck.rows[0].sufficient) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(409).json({
          error: "Insufficient available balance for this bid",
        });
      }

      const result = await client.query(
        `INSERT INTO bids (auction_id, bidder_id, amount)
         VALUES ($1, $2, $3)
         RETURNING id, auction_id, bidder_id, amount, created_at`,
        [id, req.userId, amount],
      );

      await client.query("COMMIT");
      transactionOpen = false;
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      if (client && transactionOpen) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("Failed to roll back bid transaction", rollbackError);
        }
      }

      console.error("Failed to place bid", error);
      return res.status(500).json({ error: "Failed to place bid" });
    } finally {
      client?.release();
    }
  });

  // Withdraw the current user's leading bid
  router.post("/withdraw", authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    let client;
    let transactionOpen = false;

    try {
      client = await pool.connect();
      await client.query("BEGIN");
      transactionOpen = true;

      const auctionResult = await client.query(
        `SELECT id, (ends_at > NOW()) AS is_open
         FROM auctions
         WHERE id = $1
         FOR UPDATE`,
        [id],
      );

      const auction = auctionResult.rows[0];

      if (!auction) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(404).json({ error: "Auction not found" });
      }

      if (!auction.is_open) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(409).json({ error: "Auction has ended" });
      }

      const leadingBidResult = await client.query(
        `SELECT bidder_id
         FROM bids
         WHERE auction_id = $1
           AND withdrawn_at IS NULL
         ORDER BY amount DESC, created_at ASC
         LIMIT 1`,
        [id],
      );

      if (
        !leadingBidResult.rows[0] ||
        String(leadingBidResult.rows[0].bidder_id) !== req.userId
      ) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res.status(409).json({
          error: "You are not leading this auction",
        });
      }

      await client.query(
        `UPDATE bids
         SET withdrawn_at = NOW()
         WHERE auction_id = $1
           AND bidder_id = $2
           AND withdrawn_at IS NULL`,
        [id, req.userId],
      );

      await client.query("COMMIT");
      transactionOpen = false;
      return res.json({ success: true });
    } catch (error) {
      if (client && transactionOpen) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("Failed to roll back withdrawal", rollbackError);
        }
      }

      console.error("Failed to withdraw bid", error);
      return res.status(500).json({ error: "Failed to withdraw bid" });
    } finally {
      client?.release();
    }
  });

  // View auction bid history, including withdrawn bids
  router.get("/", async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    try {
      const auctionResult = await pool.query(
        "SELECT id FROM auctions WHERE id = $1",
        [id],
      );

      if (auctionResult.rows.length === 0) {
        return res.status(404).json({ error: "Auction not found" });
      }

      const result = await pool.query(
        `SELECT
           bids.id,
           bids.amount,
           bids.created_at,
           bids.withdrawn_at,
           users.name AS bidder_name
         FROM bids
         JOIN users ON users.id = bids.bidder_id
         WHERE bids.auction_id = $1
         ORDER BY bids.withdrawn_at NULLS FIRST,
                  bids.amount DESC,
                  bids.created_at ASC`,
        [id],
      );

      return res.json(result.rows);
    } catch (error) {
      console.error("Failed to fetch auction bids", error);
      return res.status(500).json({ error: "Failed to fetch auction bids" });
    }
  });

  // Get the current user's active bids
  router.get("/mine", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           a.id,
           a.title,
           a.image_url,
           a.model_year,
           a.mileage,
           a.starting_price,
           a.ends_at,
           MAX(my_bids.amount) AS my_highest_bid,
           MAX(my_bids.created_at) AS my_last_bid_at,
           (
             SELECT MAX(all_bids.amount)
             FROM bids all_bids
             WHERE all_bids.auction_id = a.id
               AND all_bids.withdrawn_at IS NULL
           ) AS current_bid
         FROM bids my_bids
         JOIN auctions a ON a.id = my_bids.auction_id
         WHERE my_bids.bidder_id = $1
           AND my_bids.withdrawn_at IS NULL
         GROUP BY a.id
         ORDER BY my_last_bid_at DESC`,
        [req.userId],
      );

      return res.json(result.rows);
    } catch (error) {
      console.error("Failed to fetch user's bids", error);
      return res.status(500).json({ error: "Failed to fetch your bids" });
    }
  });

  return router;
};