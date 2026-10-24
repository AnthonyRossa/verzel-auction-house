const express = require("express");
const bcrypt = require("bcryptjs");

module.exports = (pool) => {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      Buffer.byteLength(password, "utf8") < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        error: "Provide a name, valid email, and password of 12-72 bytes",
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const passwordHash = await bcrypt.hash(password, 12);

      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, created_at`,
        [name.trim(), normalizedEmail, passwordHash],
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      if (
        error.code === "23505" &&
        error.constraint === "users_email_lower_unique"
      ) {
        return res.status(409).json({ error: "Email is already registered" });
      }

      console.error("Failed to register user", error);
      return res.status(500).json({ error: "Failed to register user" });
    }
  });

  return router;
};
