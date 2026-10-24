const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authenticateToken;
