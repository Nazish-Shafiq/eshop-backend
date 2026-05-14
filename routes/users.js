const express = require("express");
const router = express.Router();
const pool = require("../db"); // PostgreSQL pool connection
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Route to get all users

router.get("/me", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, is_admin, user_name, email, phone, city, country, street, zip, is_blocked FROM public.users"
    ); // SQL query to get all users
    const userList = result.rows; // Get the rows returned from the query
    res.status(200).json(userList); // Send the list of users as a JSON response
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "An error occurred while fetching users" });
  }
});


// Route to get users by id
router.get("/:id", async (req, res) => {
  const { id } = req.params; // Get the user_id from the URL parameters
  const userId = parseInt(id, 10); // Convert the id to an integer

  // Check if the userId is a valid integer
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  try {
    // Query the database to fetch the user by userId
    const query =
      "SELECT user_id, is_admin, user_name, email, phone, city, country, street, zip, is_blocked FROM public.users WHERE user_id = $1";
    const result = await pool.query(query, [userId]); // Pass userId (integer) to the query

    // If no user is found, return a 404 error
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Return the user details
    res.status(200).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.post("/signup", async (req, res) => {
  const { user_name, email, password, phone, city, country, street, zip } =
    req.body;

  // Validate input
  if (!user_name || !email || !password || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Password strength check
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  try {
    // Check if the user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (user_name, email, password, phone, city, country, street, zip, is_admin, is_blocked) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [
        user_name,
        email,
        hashedPassword,
        phone,
        city || null,
        country || null, 
        street || null, 
        zip || null, 
        false, // is_admin is set to false by default
        false, // is_blocked is set to false by default
      ]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.rows[0].id, email: newUser.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return success response
    return res.status(201).json({
      message: "Signup successful",
      token: token,
      user: {
        id: newUser.rows[0].id,
        user_name: newUser.rows[0].user_name,
        email: newUser.rows[0].email,
      },
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      is_admin = false,
      user_name,
      email,
      password, 
      phone = null,
      city = null,
      country = null,
      street = null,
      zip = null,
    } = req.body;

    // ✅ Ensure required fields are present
    if (!user_name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ✅ Insert into DB using hashedPassword
    const query = `
      INSERT INTO public.users (is_admin, user_name, email, password, phone, city, country, street, zip)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
    `;
    const values = [
      is_admin,
      user_name,
      email,
      hashedPassword,
      phone,
      city,
      country,
      street,
      zip,
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, users: result.rows[0] });
  } catch (err) {
    console.error("Error in creating user:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  const userId = req.params.id; // Get user ID from route params
  const {
    is_admin,
    user_name,
    email,
    password_hash, 
    phone,
    city,
    country,
    street,
    zip,
  } = req.body;

  try {
    let query = `
      UPDATE users
      SET 
        is_admin = $1, 
        user_name = $2, 
        email = $3, 
        phone = $4, 
        city = $5, 
        country = $6, 
        street = $7, 
        zip = $8
    `;

    const values = [
      is_admin,
      user_name,
      email,
      phone,
      city,
      country,
      street,
      zip,
    ];

    // Check if password is provided
    if (password_hash) {
      // Hash the password using bcrypt
      const saltRounds = 10; // You can adjust the salt rounds (higher means more secure but slower)
      const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

      // Update query to include the hashed password
      query += `, password_hash = $9 WHERE id = $10 RETURNING *;`;
      values.push(hashedPassword, userId); // Add hashed password and userId to the values array
    } else {
      query += ` WHERE id = $9 RETURNING *;`;
      values.push(userId); // Only add userId to values array
    }

    // Execute the query
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Send response with the updated user details
    res.status(200).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Error executing update query", err.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const JWT_SECRET = process.env.JWT_SECRET;
router.post("/login", async (req, res) => {
  // Log when the route is hit
  const { email, password } = req.body;

  console.log("Request body:", req.body);

  if (!email || !password) {
    console.log("Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Query the database for the user with the provided email
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // Log the result of the database query
    console.log("User query result:", user.rows);

    // Check if user exists
    if (user.rowCount === 0) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve the user data
    const hashedPassword = user.rows[0].password;
    const userName = user.rows[0].user_name; 
    const isBlocked = user.rows[0].is_blocked;
    console.log("Hashed password from DB:", hashedPassword);

    //Check if the user is blocked
    if (isBlocked) {
      console.log("User is blocked");
      return res.status(403).json({ message: "Your account has been blocked" });
    }

   
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

   
    console.log("Is password valid:", isPasswordValid);

   
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
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Respond with the token, user name, and other user details
    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        userId: user.rows[0].user_id, 
        email: user.rows[0].email,
        user_name: userName, 
      },
    });
  } catch (err) {
    // Log any errors in the try block
    console.error("Error in login route:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get/usersCount", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM users");

    res.status(200).json({ success: true, productCount: result.rows[0].count }); // Return all products
  } catch (error) {
    console.error("Error fetching users count:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch users count" });
  }
});

router.post("/signup", async (req, res) => {
  const { user_name, email, password, phone } = req.body;

  // Validate input
  if (!user_name || !email || !password || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Password strength check
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  try {
    // Check if the user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (user_name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_name, email, hashedPassword, phone]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.rows[0].id, email: newUser.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return success response
    return res.status(201).json({
      message: "Signup successful",
      token: token,
      user: {
        id: newUser.rows[0].id,
        user_name: newUser.rows[0].user_name,
        email: newUser.rows[0].email,
      },
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
