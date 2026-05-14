module.exports = {
  development: {
    client: "pg", // 'pg' stands for PostgreSQL
    connection: {
      host: "localhost", // 'localhost' (because your DB is exposed to the host machine)
      port: 5432, // Default port for PostgreSQL
      user: "postgres", // Database user (PostgreSQL default user)
      password: "12345", // Database password (update it to your DB password)
      database: "eshop_db", // Your database name in Docker (check your .env file)
    },
    migrations: {
      tableName: "knex_migrations", // The table where Knex tracks the migrations
      directory: "./migrations", // Directory where your migration files are stored
    },
  },

  staging: {
    client: "pg",
    connection: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "12345",
      database: "eshop_db",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },

 production: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
};
