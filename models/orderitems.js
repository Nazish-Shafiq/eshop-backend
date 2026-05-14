

const pool = require('../db');

// Function to create the order_items table
const createOrderItemsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS order_items (
      order_item_id SERIAL PRIMARY KEY,
      quantity INTEGER NOT NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log("order_items table created or already exists.");
  } catch (err) {
    console.error("Error creating order_items table:", err);
  }
};

module.exports = { createOrderItemsTable };
