exports.up = function (knex) {
  return knex.schema.createTable("category", function (table) {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("icon", 255);
    table.string("color", 20);
  });
};
exports.down = function (knex) {
  return knex.schema.dropTable("category");
};
