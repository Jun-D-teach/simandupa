// waWorker.js - FINAL v2 (Anti Spam + Anti Blokir + Anti Duplikasi + Retry Otomatis)
const { pool } = require('./db');
const { sendWhatsApp } = require('./whatsapp');

let isProcessing = false;
const MAX_RETRY = 3;                  // total 3x percobaan per pesan
const MAX_PER_PHONE_PER_DAY = 10;   // batas WA per nomor per hari
const BATCH_SIZE = 5;               // pesan per siklus
const DELAY_BETWEEN_MSG_MS = 5000;  // jeda antar pesan (anti-spam)
const DELAY_SAME_PHONE_MS = 10000;  // jeda ekstra bila nomor sama beruntun

// 🔒 Rate limit per nomor (pesan yang sedang diproses TIDAK ikut dihitung)
async function canSendToPhone(connection, phone, excludeId) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM wa_queue
     WHERE phone = ? AND status = 'sent' AND DATE(sent_at) = CURDATE() AND id <> ?`,
    [phone, excludeId]
  );
  return rows[0].count < MAX_PER_PHONE_PER_DAY;
}

async function markResult(connection, msg, status, errorMsg) {
  await connection.query(
    `UPDATE wa_queue SET status = ?, retry_count = ?, last_error = ?, sent_at = NULL WHERE id = ?`,
    [status, msg.retry_count + 1, errorMsg, msg.id]
  );
}

async function processWAQueue() {
  if (isProcessing) return;
  isProcessing = true;
  let connection;
  try {
    connection = await pool.getConnection();
    // 🔒 MUTEX: hanya 1 proses di seluruh server yang boleh menjalankan worker
    const [lock] = await connection.query("SELECT GET_LOCK('simandupa_wa_worker', 0) AS got");
    if (!lock[0].got) {
      console.log('[WA Queue] Skip - worker lain sedang jalan');
      return;
    }
    try {
      const [messages] = await connection.query(
        `SELECT * FROM wa_queue WHERE status = 'pending' AND retry_count < ? ORDER BY created_at ASC LIMIT ?`,
        [MAX_RETRY, BATCH_SIZE]
      );
      if (messages.length === 0) return;
      console.log(`[WA Queue] Memproses ${messages.length} pesan...`);
      let lastPhone = null;
      for (const msg of messages) {
        // ✅ Klaim atomik agar tidak diproses ganda
        const [claim] = await connection.query(
          `UPDATE wa_queue SET status = 'sent', sent_at = NOW() WHERE id = ? AND status = 'pending'`,
          [msg.id]
        );
        if (claim.affectedRows !== 1) {
          console.log(`[WA Queue] Skip id=${msg.id} - sudah diklaim`);
          continue;
        }
        // 🛡️ Rate limit per nomor per hari
        if (!(await canSendToPhone(connection, msg.phone, msg.id))) {
          console.log(`[WA Queue] ⚠️ id=${msg.id} ${msg.phone} - limit ${MAX_PER_PHONE_PER_DAY}/hari tercapai`);
          await markResult(connection, msg, 'failed', `Limit ${MAX_PER_PHONE_PER_DAY} WA/hari tercapai`);
          continue;
        }
        // ⏱️ Jeda ekstra bila nomor sama beruntun
        if (lastPhone === msg.phone) {
          console.log(`[WA Queue] Delay ekstra ${DELAY_SAME_PHONE_MS / 1000}s (nomor sama)`);
          await new Promise((r) => setTimeout(r, DELAY_SAME_PHONE_MS));
        }
        try {
          console.log(`[WA Queue] Mengirim ke ${msg.phone}...`);
          const result = await sendWhatsApp(msg.phone, msg.message);
          if (!result.success) {
            const errorMsg = String(result.data?.reason || result.data?.message || result.message || 'Ditolak server').slice(0, 250);
            console.log(`[WA Queue] ❌ Gagal kirim ke ${msg.phone}: ${errorMsg}`);
            // 🔁 FIX BUG 1: retry selama belum melebihi MAX_RETRY, selain itu gagal permanen
            const nextStatus = msg.retry_count + 1 < MAX_RETRY ? 'pending' : 'failed';
            await markResult(connection, msg, nextStatus, errorMsg);
          } else {
            console.log(`[WA Queue] ✅ Terkirim ke ${msg.phone}`);
            await connection.query(`UPDATE wa_queue SET last_error = NULL WHERE id = ?`, [msg.id]);
          }
        } catch (err) {
          // 🔁 FIX BUG 3: error jaringan juga dicatat & di-retry
          const errorMsg = String(err.message || 'Error jaringan').slice(0, 250);
          console.error(`[WA Queue] Error kirim ke ${msg.phone}: ${errorMsg}`);
          const nextStatus = msg.retry_count + 1 < MAX_RETRY ? 'pending' : 'failed';
          await markResult(connection, msg, nextStatus, errorMsg);
        }
        lastPhone = msg.phone;
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_MSG_MS));
      }
    } finally {
      await connection.query("SELECT RELEASE_LOCK('simandupa_wa_worker')");
    }
  } catch (error) {
    console.error('[WA Queue] Worker Error:', error);
  } finally {
    isProcessing = false;
    if (connection) connection.release();
  }
}

module.exports = { processWAQueue };