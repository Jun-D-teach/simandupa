// waWorker.js - FIXED VERSION
const { pool } = require('./db');
const { sendWhatsApp } = require('./whatsapp');

let isProcessing = false; // Flag untuk mencegah overlap

async function processWAQueue() {
  // Jika sedang proses, skip (mencegah overlap)
  if (isProcessing) {
    console.log('[WA Queue] Skip - masih ada proses berjalan');
    return;
  }
  
  isProcessing = true;
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Ambil hanya yang status 'pending' dan retry_count < 3
    const [messages] = await connection.query(
      "SELECT * FROM wa_queue WHERE status = 'pending' AND retry_count < 3 ORDER BY created_at ASC LIMIT 15"
    );
    
    if (messages.length === 0) {
      console.log('[WA Queue] Tidak ada pesan pending');
      return;
    }
    
    console.log(`[WA Queue] Memproses ${messages.length} pesan...`);
    
    for (const msg of messages) {
      try {
        // Double check status sebelum kirim (mencegah race condition)
        const [currentStatus] = await connection.query(
          "SELECT status FROM wa_queue WHERE id = ?",
          [msg.id]
        );
        
        if (currentStatus[0].status !== 'pending') {
          console.log(`[WA Queue] Skip id=${msg.id} - status sudah ${currentStatus[0].status}`);
          continue;
        }
        
        console.log(`[WA Queue] Mengirim ke ${msg.phone}...`);
        
        const result = await sendWhatsApp(msg.phone, msg.message);
        
        if (result.success) {
          await connection.query(
            "UPDATE wa_queue SET status = 'sent', sent_at = NOW() WHERE id = ?",
            [msg.id]
          );
          console.log(`[WA Queue] ✅ Terkirim ke ${msg.phone}`);
        } else {
          await connection.query(
            "UPDATE wa_queue SET status = 'failed', retry_count = retry_count + 1 WHERE id = ?",
            [msg.id]
          );
          console.log(`[WA Queue]  Gagal ke ${msg.phone}`);
        }
        
        // Delay 2 detik antar pesan
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.error(`[WA Queue] Error untuk ${msg.phone}:`, err.message);
        await connection.query(
          "UPDATE wa_queue SET retry_count = retry_count + 1 WHERE id = ?",
          [msg.id]
        );
      }
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