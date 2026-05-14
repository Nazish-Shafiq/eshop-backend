exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('user_id').primary();
    table.boolean('is_admin').defaultTo(false);
    table.string('user_name', 255).notNullable();
    table.string('email', 255).notNullable();
    table.string('password', 255).notNullable();
    table.string('phone', 20);
    table.string('city', 255);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};