const express = require("express");
const router = express.Router();
const pool = require("../db");
const authJwt = require("../helper/jwt");

// User reports a product
router.post("/", async (req, res) => {
  console.log("Report route hit");
  console.log("JWT Payload:", req.user); // Log the decoded JWT payload

  const { product_id, reason } = req.body;
  const reported_by = req.user.userId; // Make sure userId is part of the payload

  if (!reported_by) {
    return res.status(400).json({ message: "User ID missing" });
  }

  // Insert the report into the reports table
  const reportQuery = `
    INSERT INTO reports (product_id, reported_by, reason, status, created_at)
    VALUES ($1, $2, $3, 'pending', NOW()) RETURNING *`;
  const reportValues = [product_id, reported_by, reason];

  try {
    const reportResult = await pool.query(reportQuery, reportValues);
    console.log("Inserted report:", reportResult.rows[0]);

    // After report is inserted, update the product status to 'confirmed'
    const updateProductQuery = `
      UPDATE reports
      SET status = 'confirmed'
      WHERE product_id = $1
      RETURNING *;
    `;
    const updateValues = [product_id];

    const updateResult = await pool.query(updateProductQuery, updateValues);
    console.log("Product status updated to confirmed:", updateResult.rows[0]);

    // Respond with the report data
    res.json(reportResult.rows[0]);
  } catch (err) {
    console.error("Error inserting report or updating product:", err);
    res.status(500).json({ message: "Error reporting product" });
  }
});

// Get all reports or reports for a specific product
router.get("/", async (req, res) => {
  console.log("Get report route hit");

  const { product_id } = req.query; // Get product_id from query string

  try {
    let query;
    let values = [];

    if (product_id) {
      // If a product_id is provided, fetch reports for that product
      query = `
          SELECT r.*, p.product_name, u.user_name 
          FROM reports r
          JOIN products p ON r.product_id = p.product_id
          JOIN users u ON r.reported_by = u.user_id
          WHERE r.product_id = $1;
        `;
      values = [product_id];
    } else {
      // If no product_id is provided, fetch all reports
      query = `
          SELECT r.*, p.product_name, u.user_name 
          FROM reports r
          JOIN products p ON r.product_id = p.product_id
          JOIN users u ON r.reported_by = u.user_id;
        `;
    }

    const result = await pool.query(query, values);

    // If no reports found
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No reports found" });
    }

    // Send the reports as JSON response
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ message: "Error fetching reports" });
  }
});

module.exports = router;
