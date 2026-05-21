const crypto = require("crypto");

const HASH_ALGORITHM = "scrypt";
const KEY_LENGTH = 64;

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(`${base64}${padding}`, "base64");
}

function hashPassword(password) {
  const salt = toBase64Url(crypto.randomBytes(16));
  const key = crypto.scryptSync(password, salt, KEY_LENGTH);

  return `${HASH_ALGORITHM}$${salt}$${toBase64Url(key)}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  const [algorithm, salt, storedKey] = storedHash.split("$");

  if (algorithm !== HASH_ALGORITHM || !salt || !storedKey) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  const storedKeyBuffer = fromBase64Url(storedKey);

  if (storedKeyBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedKeyBuffer, derivedKey);
}

module.exports = {
  hashPassword,
  verifyPassword
};
