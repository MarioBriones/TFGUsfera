const { Pool } = require("pg");

const pool = new Pool({
  user: "usfera", // Por defecto en Mac es tu nombre de usuario en el sistema
  host: "localhost",
  database: "usfera_base",
  port: 5432,
});

pool.connect()
  .then(() => console.log("📦 Conectado a PostgreSQL"))
  .catch((err) => console.error("❌ Error de conexión", err));

module.exports = pool;
