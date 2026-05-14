const { pool } = require("pg");
 

// Define the Order model
const Order = sequelize.define(
  "Order",
  {
    orderItems: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      allowNull: false,
    },
    shippingAddress1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingAddress2: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Pending",
    },
    totalPrice: {
      type: DataTypes.FLOAT,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dateOrdered: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "orders", // Explicitly defining the table name
  }
);

// Model associations
Order.associate = function (models) {
  if (models.User) {
    Order.belongsTo(models.User, { foreignKey: "userId" });
  } else {
    console.error("User model not found for association");
  }
};

// Export the Order model
module.exports = Order;
