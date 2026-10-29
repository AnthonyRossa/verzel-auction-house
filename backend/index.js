require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(express.json());
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool();
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

app.use(cors({
  origin: [
    "http://localhost:3001",
    "https://verzel-auction-house-nu.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use("/api/auctions", auctionsRouter);
app.use("/api/users", usersRouter);
app.use("/api/auctions/:id/bids", bidsRouter);
app.use("/api/bids", bidsRouter);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
