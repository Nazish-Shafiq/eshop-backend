const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authAdmin = require("../middleware/authAdmin");

//Secret key (use env in production)
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  // Log the incoming request body
  console.log("Admin login request body:", req.body);

  // Check if email and password are provided
  if (!email || !password) {
    console.log("Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Query the database for the user with the provided email
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // Log the result of the database query for debugging purpose
    console.log("User query result:", user.rows);

    // Check if user exists
    if (user.rowCount === 0) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve the hashed password and is_admin field from the database
    const hashedPassword = user.rows[0].password;
    const userName = user.rows[0].user_name;
    const isAdmin = user.rows[0].is_admin; 

    // Log if the user is an admin
    console.log("Is the user an admin?", isAdmin);

    // Check if the user is an admin
    if (!isAdmin) {
      console.log("User is not an admin");
      return res.status(403).json({ message: "Not authorized as an admin" }); // 403 Forbidden
    }

    // Compare the provided plain password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    // Log the result of the password comparison
    console.log("Is password valid:", isPasswordValid);

    // If the password is invalid
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid password" });
    }

    // Create JWT token if the password is valid
    const token = jwt.sign(
      {
        userId: user.rows[0].user_id,
        email: user.rows[0].email,
        userName: userName,
        role: "admin", // Explicitly set the role as admin
      },
      JWT_SECRET, // Use the JWT_SECRET constant
      { expiresIn: "1d" }
    );

    // Respond with the token and user details
    return res.status(200).json({
      message: "Admin login successful",
      token: token,
      user: {
        userId: user.rows[0].user_id,
        email: user.rows[0].email,
        user_name: userName,
      },
    });
  } catch (err) {
    // Log any errors in the try block
    console.error("Error in admin login route:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Block a user by ID
router.put("/block-user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE users SET is_blocked = true WHERE user_id = $1 RETURNING *",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User blocked successfully", user: result.rows[0] });
  } catch (err) {
    console.error("Error blocking user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Example route protected for admins only
router.get("/dashboard", authAdmin, (req, res) => {
  // This route is now protected by the authAdmin middleware
  res.status(200).json({ message: "Welcome to the admin dashboard" });
});

module.exports = router;
