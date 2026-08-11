// waWorker.js - FIXED VERSION
const { pool } = require('./db');
const { sendWhatsApp } = require('./whatsapp');

let isProcessing = false; // Flag untuk mencegah overlap

async function processWAQueue() {
  if (isProcessing) return;
  isProcessing = true;
  let connection;
  try {
    connection = await pool.getConnection();

    // 🔒 MUTEX: hanya 1 proses di seluruh server yang boleh menjalankan worker
    const [lock] = await connection.query(
      "SELECT GET_LOCK('simandupa_wa_worker', 0) AS got"
    );
    if (!lock[0].got) return; // proses lain sedang bekerja

    try {
      const [messages] = await connection.query(
        "SELECT * FROM wa_queue WHERE status = 'pending' AND retry_count < 3 ORDER BY created_at ASC LIMIT 15"
      );
      if (messages.length === 0) return;

      for (const msg of messages) {
        // ✅ Klaim atomik: proses lain TIDAK bisa mengambil baris yang sama
        const [claim] = await connection.query(
          "UPDATE wa_queue SET status = 'sent', sent_at = NOW() WHERE id = ? AND status = 'pending'",
          [msg.id]
        );
        if (claim.affectedRows !== 1) continue; // sudah diklaim proses lain

        try {
          const result = await sendWhatsApp(msg.phone, msg.message);
          if (!result.success) {
            await connection.query(
              "UPDATE wa_queue SET status = 'failed', retry_count = retry_count + 1, sent_at = NULL WHERE id = ?",
              [msg.id]
            );
          }
        } catch (err) {
          await connection.query(
            "UPDATE wa_queue SET status = 'failed', retry_count = retry_count + 1, sent_at = NULL WHERE id = ?",
            [msg.id]
          );
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    } finally {
      await connection.query("SELECT RELEASE_LOCK('simandupa_wa_worker')");
    }
  } catch (error) {
    console.error("[WA Queue] Worker Error:", error);
  } finally {
    isProcessing = false;
    if (connection) connection.release();
  }
}

// JANGAN ADA setInterval DI SINI!
// Interval ada di server.js

module.exports = { processWAQueue };