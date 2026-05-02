const { verify } = require("../utils/jwt");
const { unauthorized, forbidden } = require("../utils/response");

/**
 * verifyToken — validates JWT from Authorization header.
 * Attaches decoded payload to req.user
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized(res, "Access token required");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verify(token);
    req.user = decoded;
    //console.log("DECODED:", decoded);
//     DECODED: {
//   id: 'NUR001',
//   role: 'Nurse',
//   name: 'Ms. Taslima Khanam',
//   iat: 1777752677,
//   exp: 1778357477
// }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return unauthorized(res, "Token expired — please login again");
    }
    return unauthorized(res, "Invalid token");
  }
};

/**
 * requireRole(...roles) — checks req.user.role is one of the allowed roles.
 * Must be used AFTER verifyToken.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return unauthorized(res);

  if (!roles.includes(req.user.role)) {
    return forbidden(res, `Access denied. Required role: ${roles.join(" or ")}`);
  }
  next();
};

module.exports = { verifyToken, requireRole };
