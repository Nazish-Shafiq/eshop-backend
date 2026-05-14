exports.up = function (knex) {
  return knex.schema.createTable("products", function (table) {
    table.increments("product_id").primary();
    table.string("product_name", 255).notNullable();
    table.string("brand", 255);
    table.decimal("price", 10, 2).notNullable();
    table.text("description");
    table.boolean("is_featured").defaultTo(false);
    table.integer("category_id");
  });
};
exports.down = function (knex) {
  return knex.schema.dropTable("products");
};
