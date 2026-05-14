exports.up = function (knex) {
  return knex.schema.createTable("orders", function (table) {
    table.increments("order_id").primary();
    table.string("shipping_address", 255).notNullable();
    table.string("city", 100).notNullable();
    table.string("zip").notNullable();
    table.string("country", 100).notNullable();
    table.string("phone", 20).notNullable();
    table.string("status", 20).defaultTo("Pending");
    table.decimal("total_price", 10, 2);
    table
      .integer("user_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("date_ordered").defaultTo(knex.fn.now());
    table.specificType("order_items", "integer[]");
  });
};
exports.down = function (knex) {
  return knex.schema.dropTable("orders");
};
