const express = require("express");
const router = express.Router();
const pool = require("../db"); // Import pool from app.js

// get report monthly or daily
router.get("/total-sales", async (req, res) => {
  try {
    console.log("Attempting to fetch total sales...");

    // Run the SQL query to calculate total sales
    const result = await pool.query(`
      SELECT SUM(total_price) AS total_sales
      FROM "orders";
    `);
    console.log("Query result:", result.rows);

    // Check if the result is empty or if there's no total sales
    if (result.rows.length === 0 || result.rows[0].total_sales === null) {
      return res.status(404).json({ message: "No orders found" });
    }

    // Extract the total sales value
    const totalSales = result.rows[0].total_sales;

    // Send back the total sales in the response
    return res.status(200).json({ total_sales: totalSales });
  } catch (error) {
    // Log the error to get more details
    console.error("Error fetching total sales:", error.message);

    // Send a detailed error response
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message, // Include error message for better debugginga
    });
  }
});

router.get("/", async (req, res) => {
  try {
    // SQL query to fetch orders along with user details,
    // placing "New" status first, then ordering by date descending
    const query = `
      SELECT 
        o.order_items,
        o.order_id,
        o.city,
        o.zip,
        o.country,
        o.phone,
        o.status,
        o.total_price,
        o.user_id,
        o.date_ordered,
        u.user_id AS user_id,  
        u.user_name
      FROM public.orders o
      LEFT JOIN public.users u 
        ON o.user_id = u.user_id
      ORDER BY
        -- Put "New" orders first
        CASE 
          WHEN o.status = 'New' THEN 0
          ELSE 1
        END,
        -- Then sort all orders (including the New ones) by date descending
        o.date_ordered DESC;
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching orders and users:", err.message);
    console.error("Failed Query:", err.stack);
    res.status(500).json({
      error: "An error occurred while fetching orders and users",
      details: err.message,
    });
  }
});

// Route to get orders by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT order_id, shipping_address, city, zip, country, phone, status, total_price, user_id, date_ordered
      FROM public.orders
      WHERE order_id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found with ID " + id });
    }

    res.status(200).json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error("Error fetching order:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route to post orders
router.post("/", async (req, res) => {
  try {
    const {
      order_items,
      shipping_address,
      city,
      zip,
      country,
      phone,
      status,
      total_price,
      user_id,
      date_ordered,
    } = req.body;

    //Validation: check if order_items is missing, not an array, or empty
    if (
      !order_items ||
      !Array.isArray(order_items) ||
      order_items.length === 0
    ) {
      return res.status(400).json({
        message: "Order items are required and should be a non-empty array",
      });
    }

    // Insert all order items and collect their IDs using Promise.all
    const orderItemsIds = await Promise.all(
      order_items.map(async ({ product_id, quantity }) => {
        if (!product_id || !quantity) {
          throw new Error("Each order item must have product_id and quantity");
        }

        const result = await pool.query(
          `INSERT INTO order_items (product_id, quantity)
           VALUES ($1, $2)
           RETURNING order_item_id`,
          [product_id, quantity]
        );

        return result.rows[0].order_item_id;
      })
    );

    //Insert into orders table without user_id
    const newOrderQuery = `
      INSERT INTO orders (
        order_items,
        shipping_address,
        city,
        zip,
        country,
        phone,
        status,
        total_price,
        user_id,
        date_ordered
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`;

    const values = [
      orderItemsIds,
      shipping_address,
      city,
      zip,
      country,
      phone,
      status,
      total_price,
      user_id,
      date_ordered,
    ];

    const newOrderResult = await pool.query(newOrderQuery, values);
    const newOrder = newOrderResult.rows[0];

    console.log("✅ Order created successfully:", newOrder);
    return res.status(201).json(newOrder);
  } catch (err) {
    console.error("❌ Error creating order:", err);
    return res.status(500).json({
      error: "An error occurred while creating the order",
      details: err.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  const ordersorder_id = req.params.id;
  const { status } = req.body;

  try {
    const query = "UPDATE orders SET status =$1 WHERE order_id=$2 RETURNING *";
    const result = await pool.query(query, [status, ordersorder_id]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, orders: result.rows[0] });
  } catch (err) {
    console.error("Error executing update query", err.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const ordersid = req.params.id;

  try {
    const result = await pool.query(
      "DELETE FROM orders WHERE order_id =  $1 RETURNING *",
      [ordersid]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: "orders not found" });
    }

    res.status(200).json({
      success: true,
      message: "orders deleted successfully",
      deletedcategory: result.rows[0],
    });
  } catch (err) {
    console.error("Error in deleting orders", err);
    res.status(500).json({ success: false, message: "server error" });
  }
});

//Route to get total order
router.get("/get/orderCount", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM orders");

    res.status(200).json({ success: true, productCount: result.rows[0].count }); // Return all products
  } catch (error) {
    console.error("Error fetching order count:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch order count" });
  }
});

// API to get orders for a specific user by user_id
router.get("/userorders/:userid", async (req, res) => {
  try {
    const userId = req.params.userid;

    console.log(`Fetching orders for user_id: ${userId}`);

    // Query the orders table to get all orders for the given user_id
    const result = await pool.query(
      `
      SELECT *
      FROM "orders"
      WHERE user_id = $1
      `,
      [userId]
    );

    // Check if no orders are found for the user
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    // Return the list of orders in the response
    res.status(200).json({ user_orders: result.rows });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error fetching user orders:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/v1/orders/user-counts
router.get("/orders/user-counts", async (req, res) => {
  try {
    // Count orders by user, join to users for names
    const query = `
      SELECT 
        u.user_id,
        u.user_name,
        COUNT(o.order_id) AS order_count
      FROM public.users u
      LEFT JOIN public.orders o
        ON u.user_id = o.user_id
      GROUP BY u.user_id, u.user_name
      ORDER BY order_count DESC, u.user_name;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching order counts per user:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order counts per user",
    });
  }
});

module.exports = router;
