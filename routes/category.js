const express = require("express");
const router = express.Router();
const pool = require("../db"); // Import pool from app.js

// GET all categories
router.get("/", async (req, res) => {
  try {
    // Query to fetch all categories
    const result = await pool.query("SELECT * FROM category");

    // Check if the result is empty
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No categories found" });
    }

    // Return all categories
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error in fetching category:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get category by id
router.get("/:id", async (req, res) => {

  // Extracting categoryId from the URL parameters
  const categoryId = req.params.id;

  try {
    // Correcting the SQL query
    const result = await pool.query("SELECT * FROM category WHERE id = $1", [
      categoryId,
    ]);

    
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

 
    res.status(200).json({ success: true, category: result.rows[0] });
  } catch (err) {
    
    console.error("Error executing query", err.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST to create a new category
router.post("/", async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    // Ensure data is available
    if (!name || !icon || !color) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

     const query = `
      INSERT INTO public.category (name, icon, color)
      VALUES ($1, $2, $3) RETURNING *;
    `;
    const values = [name, icon, color];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (err) {
    console.error("Error in creating category:", err.message); // Log more details
    res.status(500).json({ success: false, message: "Server error" });
  }
});



router.delete("/:id", async (req, res) => {
  const categoryId = req.params.id;

  try {
    const result = await pool.query(
      "DELETE FROM category WHERE id = $1 RETURNING *",
      [categoryId]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "category not found" });
    }

    // Only runs if rowCount > 0
    return res.status(200).json({
      success: true,
      message: "category deleted successfully",
      deletedcategory: result.rows[0],
    });
  } catch (err) {
    console.error("Error in deleting category", err);
    return res
      .status(500)
      .json({ success: false, message: "server error" });
  }
});


module.exports = router;
