const express = require("express");
const router = express.Router();
const pool = require("../db");
const { app } = require("../app");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const authJwt = require("../helper/jwt");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

//multer used to uload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("Invalid image type");

    // If file type is valid, proceed with no errors
    if (isValid) {
      uploadError = null;
    }

    // Ensure the upload directory exists fs used to rename , delete , read file
    const uploadPath = "public/upload";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(uploadError, uploadPath); // Pass error if exists, or null and the directory path
  },

  // Generate unique and safe file name by replacing spaces and adding timestamp with correct extension
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

// Set Multer options, including file size limit (optional)
const uploadOptions = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB (optional)
});

module.exports = uploadOptions;

router.get("/", async (req, res) => {
  const categoryId = req.query.categoryid
    ? parseInt(req.query.categoryid)
    : null;
  const search = req.query.search || null;
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
  const location = req.query.location || null;
  const condition = req.query.condition || null;

  try {
    let query = `
      SELECT 
        p.*, 
        EXISTS (
          SELECT 1 FROM reports r 
          WHERE r.product_id = p.product_id 
          AND r.status = 'confirmed'
        ) AS "isReported"
      FROM products p
      WHERE 1=1
    `;

    let queryParams = [];

    // Logging inputs for debugging
    console.log("Request query parameters:", req.query);

    if (categoryId) {
      queryParams.push(categoryId);
      query += ` AND p.category_id = $${queryParams.length}`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      query += ` AND (p.product_name ILIKE $${queryParams.length} OR p.description ILIKE $${queryParams.length})`;
    }

    if (minPrice) {
      queryParams.push(minPrice);
      query += ` AND p.price >= $${queryParams.length}`;
    }

    if (maxPrice) {
      queryParams.push(maxPrice);
      query += ` AND p.price <= $${queryParams.length}`;
    }

    if (location) {
      queryParams.push(`%${location}%`);
      query += ` AND p.location ILIKE $${queryParams.length}`;
    }

    if (condition && condition !== "All") {
      queryParams.push(condition);
      query += ` AND p.condition ILIKE $${queryParams.length}`;
    }

    // Logging the final query and parameters
    console.log("Executing query:", query, "with params:", queryParams);

    const result = await pool.query(query, queryParams);

    // Logging the query result
    console.log("Query result:", result.rows);

    if (result.rows.length === 0) {
      console.log("No products found matching the criteria.");
    }

    res.status(200).json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

router.get("/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    // 1. Get the product with its category and check for confirmed reports
    const productResult = await pool.query(
      `
      SELECT products.*, category.*, 
             (SELECT status FROM reports WHERE product_id = $1 AND status = 'confirmed' LIMIT 1) AS report_status
      FROM products 
      JOIN category ON category_id = category.id 
      WHERE product_id = $1
      `,
      [productId],
    );

    if (productResult.rows.length === 0) {
      return res.status(404).send("Product not found");
    }

    const productData = productResult.rows[0];

    // 2. Get the reviews for that product
    const reviewsResult = await pool.query(
      `SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC`,
      [productId],
    );

    // 3. Determine if the product has a confirmed report
    const isReported = productData.report_status === "confirmed";

    // 4. Combine both product data and reviews into one response
    const response = {
      ...productData,
      reviews: reviewsResult.rows,
      isReported, // Add the isReported flag to the response
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching product or reviews:", err.message);
    res.status(500).send("Server error");
  }
});

router.post(
  "/",
  authJwt(), //Authentication middleware
  uploadOptions.single("main_image"), //File upload middleware
  async (req, res) => {
    try {
      // Debug logs
      console.log("Request Body:", req.body);
      console.log("Authenticated User:", req.user); // Will now show user info
      console.log(
        "User ID from JWT Token:",
        req.user ? req.user.userId : "User ID not found",
      );
      console.log("Category ID in request body:", req.body.category_id);

      const {
        product_name,
        brand,
        price,
        description,
        is_featured,
        category_id,
        count_in_stock,
        phone_number,
        condition,
        location,
        user_id, // Allow user_id from body (if necessary)
      } = req.body;

      const file = req.file;

      if (!file) {
        return res.status(400).send("No image in the request");
      }

      //create accessible url for upload image

      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;
      const main_image = `${basePath}${fileName}`;

      console.log("User ID for product creation:", user_id || req.user.userId);

      const query = `
        INSERT INTO products 
        (product_name, brand, price, description, is_featured, category_id, count_in_stock, main_image, phone_number, user_id, condition, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;

      const values = [
        product_name,
        brand,
        price,
        description,
        is_featured,
        category_id,
        count_in_stock,
        main_image,
        phone_number,
        user_id || req.user.userId, // Use user_id from body or from JWT token
        condition,
        location,
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: result.rows[0],
      });
    } catch (err) {
      console.error("Error occurred:", err);
      res.status(500).send(err.message || "Server error");
    }
  },
);

router.put("/:id", async (req, res) => {
  const productId = req.params.id;
  const {
    product_name,
    brand,
    price,
    description,
    is_featured,
    category_id,
    count_in_stock,
  } = req.body;

  try {
    const query = `
      UPDATE products
      SET
        product_name = $1,
        brand = $2,
        price = $3,
        description = $4,
        is_featured = $5,
        category_id = $6,
        count_in_stock = $7
      WHERE product_id = $8
      RETURNING *;
    `;

    const result = await pool.query(query, [
      product_name,
      brand,
      price,
      description,
      is_featured,
      category_id,
      count_in_stock,
      productId,
    ]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found or not updated." });
    }

    res.status(200).json({
      success: true,
      product: result.rows[0],
    });
  } catch (err) {
    console.error("Error executing update query", err.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.delete("/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const result = await pool.query(
      "DELETE FROM products WHERE product_id =  $1 RETURNING *",
      [productId],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: "product not found" });
    }

    res.status(200).json({
      success: true,
      message: "product deleted successfully",
      deletedproduct: result.rows[0],
    });
  } catch (err) {
    console.error("Error in deleting product", err);
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.get("/get/productCount", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM products");

    res.status(200).json({ success: true, productCount: result.rows[0].count }); // Return all products
  } catch (error) {
    console.error("Error fetching product count:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch product count" });
  }
});

router.get("/get/featuredproducts/:count", async (req, res) => {
  const count = parseInt(req.params.count);

  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS name 
       FROM products p 
       JOIN category c 
       ON p.category_id = c.id 
       WHERE p.is_featured = true 
       LIMIT $1`,
      [count],
    );

    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No featured products found" });
    }

    if (result.rows.length < count) {
      return res.status(200).json({
        success: true,
        featuredproducts: result.rows,
      });
    }

    res.status(200).json({ success: true, featuredproducts: result.rows });
  } catch (error) {
    console.error("Error fetching featured products: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
    });
  }
});

// GET /api/v1/products/user/:id
router.get("/user/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10); // Convert to integer

    const query = `
      SELECT products.*, category.name AS category_name
      FROM products
      JOIN category ON products.category_id = category.id
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    console.log("Fetched products:", result.rows);

    res.status(200).json({
      success: true,
      products: result.rows,
    });
  } catch (err) {
    console.error("Error fetching user products:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
