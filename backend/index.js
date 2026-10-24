require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();
const pool = new Pool();
const port = process.env.PORT || 3000;

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database connection failed", error);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
