const pool = require("../db");

const addProduct = async (
  id,
  product_name,
  brand,
  price,
  description,
  is_featured,
  category,
  count_in_stock,

  phone_number
) => {
  try {
    const queryText = `
      INSERT INTO products (id, product_name, brand, price, description, is_featured, category, count_in_stock, phone_number) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *;  -- Return the inserted product
    `;

    // The values to be inserted into the table
    const values = [
      id,
      product_name,
      brand,
      price,
      description,
      is_featured,
      category,
      count_in_stock,
   phone_number,
    ];

    // Execute the query and insert data into the table
    const res = await pool.query(queryText, values);

    // Log and return the inserted product
    console.log("Product added:", res.rows[0]);
    return res.rows[0]; // Return the inserted product
  } catch (err) {
    console.error("Error adding product", err); // Error handling
  }
};
