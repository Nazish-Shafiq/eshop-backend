const { expressjwt } = require("express-jwt");

function authJwt() {
  const JWT_SECRET = process.env.JWT_SECRET; // Make sure this matches your .env variable name
  const api = process.env.API_URL;
  return expressjwt({
    secret: JWT_SECRET,
    algorithms: ["HS256"],
    requestProperty: "user",
  }).unless({
    path: [
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },   // Paths that don't need JWT authentication
      { url: /\/api\/v1\/category(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/public\/upload(.*)/, methods: ["GET", "OPTIONS"] },

      `${api}/users/login`,
      `${api}/users/register`,
      `${api}/users/signup`,
      `${api}/admin/admin-login`,
    ], // Routes that don't need JWT authentication
  });
}

module.exports = authJwt;
