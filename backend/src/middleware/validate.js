const { badRequest } = require("../utils/response");

/**
 * validate(fields) — checks that all listed fields exist and are non-empty
 * in req.body. Returns 400 if any are missing.
 *
 * Usage: router.post("/", validate(["name", "email"]), handler)
 */
const validate = (fields) => (req, res, next) => {
  const missing = fields.filter(
    (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ""
  );

  if (missing.length > 0) {
    return badRequest(res, `Missing required fields: ${missing.join(", ")}`);
  }
  next();
};

module.exports = validate;
