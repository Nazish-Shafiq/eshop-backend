exports.up = function (knex) {
  return knex.schema.createTable("reports", function (table) {
    table.increments("id").primary();
    table
      .integer("product_id")
      .references("product_id")
      .inTable("products")
      .onDelete("CASCADE");
    table
      .integer("reported_by")
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("reason");
    table.string("status", 20).defaultTo("pending");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};
exports.down = function (knex) {
  return knex.schema.dropTable("reports");
};
