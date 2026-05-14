const { Pool } = require("pg");
require("dotenv").config(); // Ensure your environment variables are loaded

// Set up PostgreSQL connection using Pool

const pool = new Pool({
  user: process.env.DB_USER, // DB username
  host: process.env.DB_HOST, // DB host
  database: process.env.DB_DATABASE, // DB name
  password: process.env.DB_PASSWORD, // DB password
  port: process.env.DB_PORT, // DB port (default: 5432)
});

// Test the connection to the database
pool
  .connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Error connecting to the database", err));

module.exports = pool; // Export the pool for use in other files
