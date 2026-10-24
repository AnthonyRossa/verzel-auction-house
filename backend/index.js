require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
const pool = new Pool();
const bidsRouter = require("./routes/bids")(pool);
const auctionsRouter = require("./routes/auctions")(pool);
const usersRouter = require("./routes/users")(pool);
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

app.use("/api/auctions", auctionsRouter);
app.use("/api/users", usersRouter);
app.use("/api/auctions/:id/bids", bidsRouter);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
