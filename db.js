const mysql = require("mysql2/promise");
require('dotenv').config();
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "u471136757_simandupa",
  password: process.env.DB_PASSWORD || "@Man2Plg",
  database: process.env.DB_NAME || "u471136757_simandupa",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // Tambahkan timeout 10 detik agar tidak hang selamanya
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL berhasil terhubung ke database:", process.env.DB_NAME || "u471136757_simandupa");
    connection.release();
  } catch (error) {
    console.error("❌ Koneksi MySQL GAGAL!");
    console.error("Host yang dicoba:", process.env.DB_HOST || "127.0.0.1");
    console.error("User yang dicoba:", process.env.DB_USER || "root");
    console.error("Database yang dicoba:", process.env.DB_NAME || "u471136757_simandupa");
    console.error("Pesan Error:", error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection
};
