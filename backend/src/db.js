const { Pool } = require('pg');
require('dotenv').config();

// Creamos la conexión o "Piscina" de conexiones hacia PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

module.exports = pool;