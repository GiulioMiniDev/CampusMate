const { verifyAuthToken } = require("../utils/tokens");

function requireAuth(req, res, next) {
  const authorization = req.get("Authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({
      error: {
        message: "Devi effettuare il login per continuare."
      }
    });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = {
      userId: Number(payload.sub),
      email: payload.email,
      role: payload.role
    };
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        message: error.message || "Sessione non valida."
      }
    });
  }
}

module.exports = {
  requireAuth
};
