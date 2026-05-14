const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");

const categoryRoutes = require("./routes/category");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");


const reportsRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const authJwt = require("./helper/jwt");
const errorHandler = require("./helper/error_handler");

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001",  "https://buysellpreloved.netlify.app"], // Allow both frontend and admin
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use(
  "/public/upload",
  express.static(path.join(__dirname, "public/upload"))
);

app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt()); // Verify token

// Routes
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/orders", ordersRoutes);


app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(errorHandler);

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
