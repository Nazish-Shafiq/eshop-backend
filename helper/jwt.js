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
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/category(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/public\/upload(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/users\/login/, methods: ["POST", "OPTIONS"] },
      { url: /\/api\/v1\/users\/register/, methods: ["POST", "OPTIONS"] },
      { url: /\/api\/v1\/users\/signup/, methods: ["POST", "OPTIONS"] },
      { url: /\/api\/v1\/admin\/admin-login/, methods: ["POST", "OPTIONS"] },
    ],
  });
}

module.exports = authJwt;
