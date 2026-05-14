exports.up = function (knex) {
  return knex.schema.createTable("order_items", function (table) {
    table.increments("order_item_id").primary();
    table.integer("quantity").notNullable();
    table
      .integer("product_id")
      .notNullable()
      .references("product_id")
      .inTable("products")
      .onDelete("CASCADE");
  });
};
exports.down = function (knex) {
  return knex.schema.dropTable("order_items");
};
