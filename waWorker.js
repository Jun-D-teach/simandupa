// waWorker.js - FINAL VERSION (Anti Spam + Anti Blokir + Anti Duplikasi)

const { pool } = require('./db');
const { sendWhatsApp } = require('./whatsapp');

let isProcessing = false;

// 🔒 Fungsi cek rate limit per nomor (max 10 WA/hari)
async function canSendToPhone(connection, phone) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM wa_queue 
     WHERE phone = ? 
     AND status = 'sent' 
     AND DATE(sent_at) = CURDATE()`,
    [phone]
  );
  return rows[0].count < 10;
}

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
    if (!lock[0].got) {
      console.log('[WA Queue] Skip - worker lain sedang jalan');
      return;
    }

    try {
      // Ambil batch kecil (5 pesan per batch)
      const [messages] = await connection.query(
        "SELECT * FROM wa_queue WHERE status = 'pending' AND retry_count < 3 ORDER BY created_at ASC LIMIT 5"
      );
      
      if (messages.length === 0) return;
      
      console.log(`[WA Queue] Memproses ${messages.length} pesan...`);

      let lastPhone = null;

      for (const msg of messages) {
        // ✅ Klaim atomik: proses lain TIDAK bisa mengambil baris yang sama
        const [claim] = await connection.query(
          "UPDATE wa_queue SET status = 'sent', sent_at = NOW() WHERE id = ? AND status = 'pending'",
          [msg.id]
        );
        
        if (claim.affectedRows !== 1) {
          console.log(`[WA Queue] Skip id=${msg.id} - sudah diklaim`);
          continue;
        }

        // 🛡️ Rate limit per nomor (max 10/hari)
        if (!(await canSendToPhone(connection, msg.phone))) {
          console.log(`[WA Queue] ⚠️ Skip ${msg.phone} - sudah limit 10/hari`);
          await connection.query(
            "UPDATE wa_queue SET status = 'failed', retry_count = retry_count + 1, sent_at = NULL WHERE id = ?",
            [msg.id]
          );
          continue;
        }

        // ⏱️ Delay ekstra jika nomor sama dengan pesan sebelumnya
        if (lastPhone === msg.phone) {
          console.log(`[WA Queue] Delay ekstra 10s (nomor sama)`);
          await new Promise(r => setTimeout(r, 10000));
        }

        try {
          console.log(`[WA Queue] Mengirim ke ${msg.phone}...`);
          const result = await sendWhatsApp(msg.phone, msg.message);
          
          if (!result.success) {
            console.log(`[WA Queue] ❌ Gagal kirim ke ${msg.phone}`);
            await connection.query(
              "UPDATE wa_queue SET status = 'failed', retry_count = retry_count + 1, sent_at = NULL WHERE id = ?",
              [msg.id]
            );
          } else {
            console.log(`[WA Queue] ✅ Terkirim ke ${msg.phone}`);
          }
        } catch (err) {
          console.error(`[WA Queue] Error kirim ke ${msg.phone}:`, err.message);
          await connection.query(
            "UPDATE wa_queue SET status = 'failed', retry_count = retry_count + 1, sent_at = NULL WHERE id = ?",
            [msg.id]
          );
        }

        lastPhone = msg.phone;
        
        // ⏱️ Delay normal antar pesan (5 detik) - aman dari deteksi spam
        await new Promise(r => setTimeout(r, 5000));
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

module.exports = { processWAQueue };