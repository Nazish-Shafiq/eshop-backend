const pool = require('../db'); 

// Function to create the reports table if it doesn't exist
const createReportsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ reports table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating reports table:", err);
  }
};

module.exports = { createReportsTable };
