const express = require("express");
const db = require("../config/database");

const router = express.Router();

router.get("/", async (req, res) => {
  let database = "online";

  try {
    await db.query("SELECT 1");
  } catch (error) {
    database = "offline";
  }

  res.json({
    service: "CampusMate API",
    status: "online",
    database,
    stack: ["Node.js", "Express", "MySQL", "WebSocket"],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
