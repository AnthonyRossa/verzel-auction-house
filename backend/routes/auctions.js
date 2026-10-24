const express = require("express");
const authenticateToken = require("../middleware/auth");

module.exports = (pool) => {
  const router = express.Router();

  //fetch all listed auctions
  router.get("/", async (_req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, title, description, starting_price, ends_at, created_at FROM auctions ORDER BY created_at DESC",
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Failed to fetch auctions", error);
      res.status(500).json({ error: "Failed to fetch auctions" });
    }
  });

  //fetch by id
  router.get("/:id", async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    try {
      const result = await pool.query(
        "SELECT id, title, description, starting_price, ends_at, created_at FROM auctions WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Auction not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Failed to fetch auction", error);
      res.status(500).json({ error: "Failed to fetch auction" });
    }
  });

  //edit or update auction by id
  router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description = null, starting_price, ends_at } = req.body ?? {};

  if (
    !/^\d+$/.test(id) ||
    typeof title !== "string" ||
    !title.trim() ||
    (description !== null && typeof description !== "string") ||
    typeof starting_price !== "number" ||
    !Number.isFinite(starting_price) ||
    starting_price < 0 ||
    typeof ends_at !== "string" ||
    Number.isNaN(Date.parse(ends_at))
  ) {
    return res.status(400).json({ error: "Invalid auction details" });
  }

  try {
    const result = await pool.query(
      `UPDATE auctions
       SET title = $1, description = $2, starting_price = $3, ends_at = $4
       WHERE id = $5 AND seller_id = $6
       RETURNING id, title, description, starting_price, ends_at, created_at`,
      [title.trim(), description, starting_price, ends_at, id, req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Auction not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update auction", error);
    res.status(500).json({ error: "Failed to update auction" });
  }
});

  //create auction 
  router.post("/", authenticateToken, async (req, res) => {
    const {
      title,
      description = null,
      starting_price,
      ends_at,
    } = req.body ?? {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      (description !== null && typeof description !== "string") ||
      typeof starting_price !== "number" ||
      !Number.isFinite(starting_price) ||
      starting_price < 0 ||
      typeof ends_at !== "string" ||
      Number.isNaN(Date.parse(ends_at))
    ) {
      return res.status(400).json({ error: "Invalid auction details" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO auctions (seller_id, title, description, starting_price, ends_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, description, starting_price, ends_at, created_at`,
        [req.userId, title.trim(), description, starting_price, ends_at],
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Failed to create auction", error);
      res.status(500).json({ error: "Failed to create auction" });
    }
  });

  return router;
};
