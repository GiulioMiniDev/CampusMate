require("dotenv").config({ quiet: true });

const env = {
  port: Number(process.env.PORT || 8000),
  authSecret: process.env.AUTH_SECRET || "campusmate-local-development-secret",
  authTokenTtlSeconds: Number(process.env.AUTH_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "campusmate"
  }
};

module.exports = env;
