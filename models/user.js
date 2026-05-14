const pool = require("../db"); // Import the connection from db.js

// Function to create a user
async function createUser(username, email, password, city, country, zip, phone, is_blocked) {
  const query =
    "INSERT INTO users (username, email, password, city, country, zip, phone, is_blocked) VALUES ($1, $2, $3, $4, $5, $6, $7,$8) RETURNING *";
  const values = [username, email, password, city, country, zip,
    phone, is_blocked 
  ];
  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Return the inserted user
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
}

// Function to get a user by email
async function getUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = $1";
  try {
    const result = await pool.query(query, [email]);
    return result.rows[0]; // Return the user if found
  } catch (err) {
    console.error("Error fetching user by email:", err);
    throw err;
  }
}

module.exports = { createUser, getUserByEmail };
