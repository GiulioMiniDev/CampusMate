const crypto = require("crypto");
const env = require("../config/env");

function toBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(`${base64}${padding}`, "base64").toString("utf8");
}

function sign(value) {
  return toBase64Url(crypto.createHmac("sha256", env.authSecret).update(value).digest());
}

function createAuthToken(user) {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + env.authTokenTtlSeconds
  };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  return `${unsignedToken}.${sign(unsignedToken)}`;
}

function verifyAuthToken(token) {
  const parts = String(token || "").split(".");

  if (parts.length !== 3) {
    throw new Error("Token non valido.");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsignedToken);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error("Token non valido.");
  }

  const header = JSON.parse(fromBase64Url(encodedHeader));
  const payload = JSON.parse(fromBase64Url(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Token non valido.");
  }

  if (!payload.sub || !payload.exp || payload.exp < now) {
    throw new Error("Sessione scaduta.");
  }

  return payload;
}

module.exports = {
  createAuthToken,
  verifyAuthToken
};
