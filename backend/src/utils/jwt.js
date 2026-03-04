const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

const sign = (payload) =>
  jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

const verify = (token) =>
  jwt.verify(token, jwtConfig.secret);

module.exports = { sign, verify };
