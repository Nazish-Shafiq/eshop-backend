const jwt = require("jsonwebtoken");
const pool = require("../db");

const authAdmin = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

 //fetch actual token from bearer token format
   const tokenWithoutBearer = token.split(" ")[1];

  if (!tokenWithoutBearer) {
    return res.status(401).json({ message: "Token format is incorrect" }); 
  }

  try {
    // Verify the token
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);

    // Check if the user is an admin
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      decoded.userId,
    ]);

    if (user.rowCount === 0 || !user.rows[0].is_admin) {
      return res.status(403).json({ message: "Not authorized as an admin" });
    }

    // Attach user info to request for further use
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authAdmin;
