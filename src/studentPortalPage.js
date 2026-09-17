// src/studentPortalPage.js — Portal Siswa (tampilan asli dipertahankan + riwayat absensi bulanan)
import { API_URL } from "./config";

function spsEsc(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function getLoggedStudent() {
  try { return JSON.parse(localStorage.getItem("simStudent") || "null"); } catch { return null; }
}
const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
function showMsg(el, text, type) { el.textContent = text; el.className = "sps-msg " + type; }
function fmtDateInput(v) {
  if (!v) return "";
  const s = String(v);
  if (s.includes("T")) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime()))
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return s.slice(0, 10);
}

export function initStudentPortalPage() {
  const student = getLoggedStudent();
  if (!student || !student.student_id) { window.location.href = "/?page=student-login"; return; }
  injectSpsStyles();
  const app = document.querySelector("#app");
  if (!app) return;
  const now = new Date();
  const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  app.innerHTML = `
  <div class="sps-wrap">
    <div class="sps-header">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div class="sps-logo">🎓</div>
        <div>
          <h1>Portal Siswa</h1>
          <p>MAN 2 Palembang — kolom bertanda 🔒 tidak dapat diubah.</p>
        </div>
      </div>
      <button id="spLogout" class="sps-logout">Logout</button>
    </div>

    <div class="sps-card">
      <h2>📌 Profil Lengkap Siswa</h2>
      <div class="sps-grid">
        <div><label class="sps-label">ID Siswa 🔒</label><input id="sp_id" class="sps-input" readonly /></div>
        <div><label class="sps-label">NIS 🔒</label><input id="sp_nis" class="sps-input" readonly /></div>
        <div><label class="sps-label">NISN 🔒</label><input id="sp_nisn" class="sps-input" readonly /></div>
        <div><label class="sps-label">Kelas 🔒</label><input id="sp_kelas" class="sps-input" readonly /></div>
        <div><label class="sps-label">Nama Lengkap</label><input id="sp_nama" class="sps-input" /></div>
        <div><label class="sps-label">Jenis Kelamin</label>
          <select id="sp_gender" class="sps-input"><option value="">Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
        <div><label class="sps-label">Tempat Lahir</label><input id="sp_birth_place" class="sps-input" /></div>
        <div><label class="sps-label">Tanggal Lahir</label><input id="sp_birth_date" type="date" class="sps-input" /></div>
        <div><label class="sps-label">Agama</label><input id="sp_religion" class="sps-input" /></div>
        <div><label class="sps-label">Tahun Masuk 🔒</label><input id="sp_entry_year" class="sps-input" readonly /></div>
        <div class="sps-full"><label class="sps-label">Alamat</label><textarea id="sp_address" class="sps-input" rows="3"></textarea></div>
        <div><label class="sps-label">Nama Orang Tua/Wali</label><input id="sp_parent_name" class="sps-input" /></div>
        <div><label class="sps-label">No. HP Orang Tua 🔒</label><input id="sp_parent_phone" class="sps-input" readonly /></div>
        <div><label class="sps-label">Email Orang Tua</label><input id="sp_parent_email" class="sps-input" /></div>
        <div><label class="sps-label">Hubungan Orang Tua</label>
          <select id="sp_parent_relation" class="sps-input"><option value="">Pilih</option><option value="ayah">Ayah</option><option value="ibu">Ibu</option><option value="wali">Wali</option></select></div>
        <div><label class="sps-label">Status Siswa 🔒</label><input id="sp_status" class="sps-input" readonly /></div>
        <div><label class="sps-label">Username Login 🔒</label><input id="sp_username" class="sps-input" readonly /></div>
        <div><label class="sps-label">Terdaftar 🔒</label><input id="sp_created" class="sps-input" readonly /></div>
        <div><label class="sps-label">Update Terakhir 🔒</label><input id="sp_updated" class="sps-input" readonly /></div>
      </div>
      <div style="margin-top:16px;"><button id="spSave" class="sps-btn">💾 Simpan Perubahan</button></div>
      <div id="sp_msg" class="sps-msg"></div>
    </div>

    <div class="sps-card">
      <h2>🔳 QR Code Absensi Saya</h2>
      <div class="sps-qr-wrap">
        <img id="sp_qr_img" class="sps-qr" alt="QR Code" style="display:none;" />
        <p id="sp_qr_note" class="sps-muted" style="display:none;">QR belum dibuat. Hubungi admin/operator madrasah.</p>
      </div>
    </div>

    <div class="sps-card">
      <h2>🔑 Ganti Password</h2>
      <div class="sps-grid">
        <div><label class="sps-label">Password Lama</label><input id="sp_old" type="password" class="sps-input" /></div>
        <div><label class="sps-label">Password Baru (min. 6 karakter)</label><input id="sp_new" type="password" class="sps-input" /></div>
        <div><label class="sps-label">Ulangi Password Baru</label><input id="sp_new2" type="password" class="sps-input" /></div>
      </div>
      <div style="margin-top:16px;"><button id="spPass" class="sps-btn">🔑 Ganti Password</button></div>
      <div id="sp_pass_msg" class="sps-msg"></div>
    </div>

    <div class="sps-card">
      <h2>📅 Riwayat Absensi Bulanan</h2>
      <div class="sps-row">
        <select id="sp_month">${MONTHS.map((m, i) => `<option value="${i + 1}" ${i === now.getMonth() ? "selected" : ""}>${m}</option>`).join("")}</select>
        <input id="sp_year" type="number" value="${now.getFullYear()}" style="width:110px;" />
        <button id="sp_load" class="sps-btn">🔄 Tampilkan</button>
      </div>
      <div id="sp_history"><p class="sps-muted">Memuat riwayat...</p></div>
    </div>
  </div>`;

  document.getElementById("spLogout").addEventListener("click", () => {
    localStorage.removeItem("simStudent");
    window.location.href = "/?page=student-login";
  });
  document.getElementById("spSave").addEventListener("click", () => saveProfile(student));
  document.getElementById("spPass").addEventListener("click", () => changePass(student));
  document.getElementById("sp_load").addEventListener("click", () => loadHistory(student));

  // Isi profil dari server (data lengkap)
  fetch(`${API_URL}/api/students/${student.student_id}`)
    .then((r) => r.json())
    .then((j) => { if (j.success) fillProfile(j.data); })
    .catch(() => fillProfile(student));
  loadHistory(student);
}

function fillProfile(s) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
  set("sp_id", s.student_id); set("sp_nis", s.nis || "-"); set("sp_nisn", s.nisn || "-"); set("sp_kelas", s.class_id || "-");
  set("sp_nama", s.student_name || ""); set("sp_gender", s.gender || "");
  set("sp_birth_place", s.birth_place || ""); set("sp_birth_date", fmtDateInput(s.birth_date));
  set("sp_religion", s.religion || ""); set("sp_entry_year", s.entry_year || "");
  set("sp_address", s.address || "");
  set("sp_parent_name", s.parent_name || ""); set("sp_parent_phone", s.parent_phone || "-");
  set("sp_parent_email", s.parent_email || ""); set("sp_parent_relation", s.parent_relation || "");
  set("sp_status", s.status_active || "-"); set("sp_username", s.username || "-");
  set("sp_created", String(s.created_at || "-").replace("T", " ").slice(0, 19));
  set("sp_updated", String(s.updated_at || "-").replace("T", " ").slice(0, 19));
  const qr = document.getElementById("sp_qr_img");
  const note = document.getElementById("sp_qr_note");
  if (s.qr_code) { qr.src = s.qr_code; qr.style.display = "inline-block"; note.style.display = "none"; }
  else { qr.style.display = "none"; note.style.display = "block"; }
}

async function saveProfile(student) {
  const btn = document.getElementById("spSave");
  const msg = document.getElementById("sp_msg");
  const payload = {
    student_name: val("sp_nama"),
    gender: val("sp_gender"),
    birth_place: val("sp_birth_place"),
    birth_date: val("sp_birth_date") || null,
    address: val("sp_address"),
    religion: val("sp_religion"),
    parent_name: val("sp_parent_name"),
    parent_email: val("sp_parent_email"),
    parent_relation: val("sp_parent_relation"),
  };
  btn.disabled = true;
  try {
    const res = await fetch(`${API_URL}/api/student/${student.student_id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const r = await res.json();
    if (!r.success) throw new Error(r.message || "Gagal menyimpan");
    showMsg(msg, `✅ ${r.message}`, "ok");
    const fr = await fetch(`${API_URL}/api/students/${student.student_id}`);
    const fj = await fr.json();
    if (fj.success) fillProfile(fj.data);
  } catch (e) {
    showMsg(msg, `❌ ${e.message}`, "err");
  } finally {
    btn.disabled = false;
  }
}

async function changePass(student) {
  const msg = document.getElementById("sp_pass_msg");
  const oldp = val("sp_old"), np = val("sp_new"), np2 = val("sp_new2");
  if (!oldp || !np || !np2) { showMsg(msg, "❌ Semua kolom wajib diisi.", "err"); return; }
  if (np.length < 6) { showMsg(msg, "❌ Password baru minimal 6 karakter.", "err"); return; }
  if (np !== np2) { showMsg(msg, "❌ Konfirmasi password tidak sama.", "err"); return; }
  try {
    const res = await fetch(`${API_URL}/api/student/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.student_id, old_password: oldp, new_password: np }),
    });
    const r = await res.json();
    if (!r.success) throw new Error(r.message || "Gagal mengubah password");
    showMsg(msg, `✅ ${r.message} Silakan login ulang dengan password baru.`, "ok");
    ["sp_old", "sp_new", "sp_new2"].forEach((id) => { document.getElementById(id).value = ""; });
  } catch (e) {
    showMsg(msg, `❌ ${e.message}`, "err");
  }
}

async function loadHistory(student) {
  const box = document.getElementById("sp_history");
  const month = Number(document.getElementById("sp_month").value);
  const year = Number(document.getElementById("sp_year").value);
  box.innerHTML = `<p class="sps-muted">Memuat riwayat...</p>`;
  try {
    const res = await fetch(`${API_URL}/api/student/${student.student_id}/attendance?month=${month}&year=${year}`);
    const r = await res.json();
    if (!r.success) throw new Error(r.message || "Gagal memuat");
    const rows = r.data || [];
    const c = (st) => rows.filter((x) => x.status === st).length;
    const badge = (s) => {
      if (s === "hadir") return `<span class="sps-badge b-ok">HADIR</span>`;
      if (s === "terlambat") return `<span class="sps-badge b-warn">TERLAMBAT</span>`;
      if (s === "sangat terlambat") return `<span class="sps-badge b-bad">SANGAT TERLAMBAT</span>`;
      if (s === "pulang") return `<span class="sps-badge b-info">PULANG</span>`;
      if (s === "tidak hadir") return `<span class="sps-badge b-bad">TIDAK HADIR</span>`;
      return spsEsc(s);
    };
    const fmtDate = (d) => { const s = String(d || "").slice(0, 10); if (!s) return "-"; const [y, m, dd] = s.split("-"); return `${dd}/${m}/${y}`; };
    box.innerHTML = `
      <div class="sps-chips">
        <span class="sps-chip">✅ Hadir: ${c("hadir")}</span>
        <span class="sps-chip">⏰ Terlambat: ${c("terlambat")}</span>
        <span class="sps-chip">🚨 Sangat Terlambat: ${c("sangat terlambat")}</span>
        <span class="sps-chip">🏠 Pulang: ${c("pulang")}</span>
        <span class="sps-chip">🚫 Tidak Hadir: ${c("tidak hadir")}</span>
      </div>
      ${rows.length ? `<div style="overflow-x:auto;"><table class="sps-table">
        <thead><tr><th>No</th><th>Tanggal</th><th>Jam</th><th>Status</th></tr></thead>
        <tbody>${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${fmtDate(x.attendance_date)}</td><td>${String(x.attendance_time || "").slice(0, 5)}</td><td>${badge(x.status)}</td></tr>`).join("")}</tbody>
      </table></div>` : `<p class="sps-muted">Belum ada data absensi pada bulan ini.</p>`}`;
  } catch (e) {
    box.innerHTML = `<p class="sps-muted">❌ ${spsEsc(e.message)}</p>`;
  }
}

function injectSpsStyles() {
  if (document.getElementById("spsStyles")) return;
  const s = document.createElement("style");
  s.id = "spsStyles";
  s.textContent =
    ".sps-wrap{max-width:1000px;margin:0 auto;padding:20px;}" +
    ".sps-header{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;background:linear-gradient(135deg,#16a34a,#15803d);border-radius:14px;padding:18px 22px;color:#fff;margin-bottom:20px;}" +
    ".sps-logo{background:rgba(0,0,0,.18);border-radius:10px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}" +
    ".sps-header h1{margin:0;font-size:22px;}" +
    ".sps-header p{margin:6px 0 0;font-size:12px;opacity:.92;}" +
    ".sps-logout{background:#dc2626;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-weight:bold;cursor:pointer;}" +
    ".sps-card{background:#f8fafc;border:1px solid #eef2f7;border-radius:14px;padding:20px 22px;margin-bottom:20px;}" +
    ".sps-card h2{margin:0 0 16px;font-size:17px;color:#0f172a;}" +
    ".sps-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;}" +
    ".sps-full{grid-column:1/-1;}" +
    ".sps-label{display:block;font-size:13px;font-weight:bold;color:#1f2937;margin-bottom:6px;}" +
    ".sps-input{width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;background:#fff;color:#0f172a;}" +
    ".sps-input[readonly]{background:#e8eef4;border-color:#dbe4ec;color:#64748b;}" +
    "textarea.sps-input{resize:vertical;min-height:70px;}" +
    ".sps-btn{background:#16a34a;color:#fff;border:none;border-radius:8px;padding:11px 18px;font-weight:bold;cursor:pointer;}" +
    ".sps-btn:disabled{opacity:.6;cursor:wait;}" +
    ".sps-msg{margin-top:12px;font-size:13px;font-weight:bold;padding:10px 12px;border-radius:8px;display:none;}" +
    ".sps-msg.ok{display:block;background:#dcfce7;color:#166534;}" +
    ".sps-msg.err{display:block;background:#fee2e2;color:#991b1b;}" +
    ".sps-qr-wrap{text-align:center;}" +
    ".sps-qr{max-width:220px;width:100%;background:#fff;border:1px solid #dbe4ec;border-radius:12px;padding:12px;}" +
    ".sps-muted{color:#64748b;font-size:13px;}" +
    ".sps-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;}" +
    ".sps-row select,.sps-row input{padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;background:#fff;}" +
    ".sps-chips{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;}" +
    ".sps-chip{background:#fff;border:1px solid #dbe4ec;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:bold;color:#334155;}" +
    ".sps-table{width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #dbe4ec;}" +
    ".sps-table th{background:#166534;color:#fff;padding:9px 10px;text-align:left;}" +
    ".sps-table td{padding:8px 10px;border-top:1px solid #eef2f7;}" +
    ".sps-badge{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:bold;}" +
    ".b-ok{background:#dcfce7;color:#166534;}.b-warn{background:#fef9c3;color:#854d0e;}.b-bad{background:#fee2e2;color:#991b1b;}.b-info{background:#e0f2fe;color:#075985;}" +
    "@media(max-width:760px){.sps-grid{grid-template-columns:1fr;}}";
  document.head.appendChild(s);
}