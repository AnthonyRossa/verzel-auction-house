const express = require("express");
const authenticateToken = require("../middleware/auth");

module.exports = (pool) => {
  const router = express.Router({ mergeParams: true });

  //bid placement
  router.post("/", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body ?? {};

    if (
      !/^\d+$/.test(id) ||
      typeof amount !== "string" ||
      !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount) ||
      /^0(?:\.0{1,2})?$/.test(amount)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid auction ID or bid amount" });
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
        return res
          .status(403)
          .json({ error: "Sellers cannot bid on their own auction" });
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
       WHERE auction_id = $3`,
        [amount, auction.starting_price, id],
      );

      if (!bidCheck.rows[0].valid) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return res
          .status(409)
          .json({ error: "Bid must exceed the current highest price" });
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

  //view auction bids
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
      `SELECT bids.id, bids.amount, bids.created_at, users.name AS bidder_name
       FROM bids
       JOIN users ON users.id = bids.bidder_id
       WHERE bids.auction_id = $1
       ORDER BY bids.amount DESC, bids.created_at ASC`,
      [id],
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch auction bids", error);
    return res.status(500).json({ error: "Failed to fetch auction bids" });
  }
});

  return router;
};
