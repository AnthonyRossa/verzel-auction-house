const express = require("express");
const authenticateToken = require("../middleware/auth");

module.exports = (pool) => {
  const router = express.Router();

  //fetch all listed auctions
  router.get("/", async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT
   a.id,
   a.seller_id,
   a.title,
   a.description,
   a.starting_price,
   a.image_url,
   a.mileage,
   a.model_year,
   a.ends_at,
   a.created_at,
   (
     SELECT MAX(b.amount)
     FROM bids b
     WHERE b.auction_id = a.id
   ) AS current_bid
 FROM auctions a
 ORDER BY a.created_at DESC`,
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
        "SELECT id, seller_id, title, description, starting_price, image_url, mileage, model_year, ends_at, created_at FROM auctions WHERE id = $1",
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
    const {
      title,
      description = null,
      image_url,
      mileage,
      model_year,
      starting_price,
      ends_at,
    } = req.body ?? {};

    if (
      !/^\d+$/.test(req.params.id) ||
      typeof title !== "string" ||
      !title.trim() ||
      (description !== null && typeof description !== "string") ||
      typeof image_url !== "string" ||
      !image_url.trim() ||
      !Number.isInteger(mileage) ||
      mileage < 0 ||
      !Number.isInteger(model_year) ||
      model_year < 1886 ||
      model_year > 2100 ||
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
       SET title = $1,
           description = $2,
           image_url = $3,
           mileage = $4,
           model_year = $5,
           starting_price = $6,
           ends_at = $7
       WHERE id = $8 AND seller_id = $9
       RETURNING id, seller_id, title, description, image_url, mileage,
                 model_year, starting_price, ends_at, created_at`,
        [
          title.trim(),
          description,
          image_url.trim(),
          mileage,
          model_year,
          starting_price,
          ends_at,
          req.params.id,
          req.userId,
        ],
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
      image_url,
      mileage,
      model_year,
      starting_price,
      ends_at,
    } = req.body ?? {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      (description !== null && typeof description !== "string") ||
      typeof image_url !== "string" ||
      !image_url.trim() ||
      !Number.isInteger(mileage) ||
      mileage < 0 ||
      !Number.isInteger(model_year) ||
      model_year < 1886 ||
      model_year > 2100 ||
      typeof starting_price !== "number" ||
      !Number.isFinite(starting_price) ||
      starting_price < 0 ||
      typeof ends_at !== "string" ||
      Number.isNaN(Date.parse(ends_at))
    ) {
      return res.status(400).json({ error: "Invalid auction details" });
    }

    let validImageUrl = false;

    if (typeof image_url === "string") {
      try {
        const parsedUrl = new URL(image_url);
        validImageUrl = ["http:", "https:"].includes(parsedUrl.protocol);
      } catch {
        validImageUrl = false;
      }
    }

    try {
      const result = await pool.query(
        `INSERT INTO auctions (
   seller_id, title, description, image_url, mileage, model_year,
   starting_price, ends_at
 )
 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
 RETURNING id, title, description, image_url, mileage, model_year,
           starting_price, ends_at, created_at`,
        [
          req.userId,
          title.trim(),
          description,
          image_url.trim(),
          mileage,
          model_year,
          starting_price,
          ends_at,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Failed to create auction", error);
      res.status(500).json({ error: "Failed to create auction" });
    }
  });

  //delete auction
  router.delete("/:id", authenticateToken, async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    try {
      const result = await pool.query(
        `DELETE FROM auctions
       WHERE id = $1 AND seller_id = $2
       RETURNING id`,
        [req.params.id, req.userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Auction not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete auction", error);
      res.status(500).json({ error: "Failed to delete auction" });
    }
  });

  return router;
};
