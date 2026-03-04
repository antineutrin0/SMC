module.exports = {
  secret:    process.env.JWT_SECRET     || "sust_medical_jwt_secret",
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
};
