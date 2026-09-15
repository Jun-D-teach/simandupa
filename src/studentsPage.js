// src/studentsPage.js — Data Siswa dengan Modal Tambah/Edit Lengkap
import { API_URL } from "./config";

let _students = [];
let _classes = [];
let _editingId = null;

function adminHeaders(withJson = true) {
  const h = { "x-admin-key": localStorage.getItem("simAdminKey") || "" };
  if (withJson) h["Content-Type"] = "application/json";
  return h;
}

function esc(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const val = (id) => (document.getElementById(id)?.value || "").trim();
const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };

export function initStudentsPage() {
  injectStdStyles();
  const box = document.getElementById("studentsPageContent");
  if (!box) return;

  box.innerHTML = `
    <div class="std-toolbar">
      <input id="stdKeyword" class="std-input" placeholder="🔍 Cari nama / NIS / NISN / ID..." />
      <select id="stdClassFilter" class="std-input"><option value="">Semua Kelas</option></select>
      <select id="stdStatusFilter" class="std-input">
        <option value="">Semua Status</option>
        <option value="aktif">Aktif</option>
        <option value="nonaktif">Nonaktif</option>
      </select>
      <button id="stdSearchBtn" class="std-btn std-btn-primary">Cari</button>
      <button id="stdResetBtn" class="std-btn">Reset</button>
      <span style="flex:1"></span>
      <button id="stdAddBtn" class="std-btn std-btn-success">➕ Tambah Siswa</button>
    </div>
    <div id="stdCount" class="std-count"></div>
    <div id="stdTableWrap" class="std-table-wrap">Memuat data...</div>

    <!-- ===== MODAL TAMBAH / EDIT ===== -->
    <div id="stdModalOverlay" class="std-overlay" style="display:none;">
      <div class="std-modal">
        <div class="std-modal-head">
          <h3 id="stdModalTitle">➕ Tambah Siswa</h3>
          <button id="stdModalClose" class="std-x" title="Tutup">✕</button>
        </div>
        <div class="std-modal-body">
          <div class="std-section">🧑‍🎓 Data Siswa</div>
          <div class="std-grid">
            <div><label class="std-label">Student ID</label><input id="f_student_id" class="std-input" readonly /></div>
            <div><label class="std-label">NIS</label><input id="f_nis" class="std-input" /></div>
            <div><label class="std-label">NISN * <small>(username login)</small></label><input id="f_nisn" class="std-input" /></div>
            <div><label class="std-label">Nama Lengkap *</label><input id="f_student_name" class="std-input" /></div>
            <div><label class="std-label">Jenis Kelamin</label>
              <select id="f_gender" class="std-input"><option value="">-</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
            <div><label class="std-label">Kelas *</label><select id="f_class_id" class="std-input"><option value="">Pilih Kelas</option></select></div>
            <div><label class="std-label">Tempat Lahir</label><input id="f_birth_place" class="std-input" /></div>
            <div><label class="std-label">Tanggal Lahir</label><input type="date" id="f_birth_date" class="std-input" /></div>
            <div><label class="std-label">Agama</label>
              <select id="f_religion" class="std-input"><option value="">-</option><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option></select></div>
            <div><label class="std-label">Tahun Masuk</label><input id="f_entry_year" class="std-input" placeholder="2026" maxlength="4" /></div>
            <div><label class="std-label">Status</label>
              <select id="f_status_active" class="std-input"><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></div>
            <div style="grid-column:1/-1;"><label class="std-label">Alamat</label><textarea id="f_address" class="std-input" rows="2"></textarea></div>
          </div>

          <div class="std-section">👨‍👩‍👧 Data Orang Tua / Wali</div>
          <div class="std-grid">
            <div><label class="std-label">Nama Ortu/Wali</label><input id="f_parent_name" class="std-input" /></div>
            <div><label class="std-label">No HP Ortu (WA)</label><input id="f_parent_phone" class="std-input" placeholder="628..." /></div>
            <div><label class="std-label">Email Ortu</label><input id="f_parent_email" class="std-input" /></div>
            <div><label class="std-label">Relasi</label>
              <select id="f_parent_relation" class="std-input"><option value="">-</option><option value="ayah">Ayah</option><option value="ibu">Ibu</option><option value="wali">Wali</option></select></div>
          </div>

          <div class="std-section">🔐 Akun</div>
          <div class="std-grid">
            <div><label class="std-label">Password Baru <small>(kosongkan jika tidak diubah)</small></label><input type="password" id="f_password" class="std-input" /></div>
            <div class="std-hint">ℹ️ Username login = <b>NISN</b>. Password default siswa baru: <b>default12345</b>.</div>
          </div>
        </div>
        <div class="std-modal-foot">
          <button id="stdSave" class="std-btn std-btn-primary">💾 Simpan</button>
          <button id="stdCancel" class="std-btn">Batal</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("stdSearchBtn").addEventListener("click", loadStudents);
  document.getElementById("stdResetBtn").addEventListener("click", () => {
    setVal("stdKeyword", ""); setVal("stdClassFilter", ""); setVal("stdStatusFilter", "");
    loadStudents();
  });
  document.getElementById("stdClassFilter").addEventListener("change", loadStudents);
  document.getElementById("stdStatusFilter").addEventListener("change", loadStudents);
  document.getElementById("stdKeyword").addEventListener("keydown", (e) => { if (e.key === "Enter") loadStudents(); });
  document.getElementById("stdAddBtn").addEventListener("click", () => openModal(null));
  document.getElementById("stdModalClose").addEventListener("click", closeModal);
  document.getElementById("stdCancel").addEventListener("click", closeModal);
  document.getElementById("stdModalOverlay").addEventListener("click", (e) => { if (e.target.id === "stdModalOverlay") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  document.getElementById("stdSave").addEventListener("click", saveStudent);

  box.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-std-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const row = _students.find((s) => s.student_id === id);
    if (!row) return;
    if (btn.dataset.stdAction === "edit") openModal(row);
    if (btn.dataset.stdAction === "del") deleteStudent(id, row.student_name);
  });

  loadClasses().then(() => loadStudents());
}

async function loadClasses() {
  try {
    const res = await fetch(`${API_URL}/api/classes`, { headers: adminHeaders(false) });
    const r = await res.json();
    _classes = r.data || [];
    const sel = document.getElementById("stdClassFilter");
    sel.innerHTML = `<option value="">Semua Kelas</option>` + _classes.map((c) => `<option value="${esc(c.class_id)}">${esc(c.class_name || c.class_id)}</option>`).join("");
    const fsel = document.getElementById("f_class_id");
    fsel.innerHTML = `<option value="">Pilih Kelas</option>` + _classes.map((c) => `<option value="${esc(c.class_id)}">${esc(c.class_name || c.class_id)}</option>`).join("");
  } catch (e) { /* abaikan */ }
}

async function loadStudents() {
  const keyword = val("stdKeyword");
  const classId = val("stdClassFilter");
  const status = val("stdStatusFilter");
  const wrap = document.getElementById("stdTableWrap");
  wrap.innerHTML = `<div class="std-loading">Memuat data...</div>`;
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (classId) params.set("classId", classId);
  if (status) params.set("status", status);
  try {
    const res = await fetch(`${API_URL}/api/students?${params.toString()}`, { headers: adminHeaders(false) });
    const r = await res.json();
    if (!r.success) throw new Error(r.message);
    _students = r.data || [];
    renderTable();
  } catch (e) {
    wrap.innerHTML = `<div class="std-alert">❌ ${esc(e.message)}</div>`;
  }
}

function renderTable() {
  const wrap = document.getElementById("stdTableWrap");
  document.getElementById("stdCount").innerHTML = `Menampilkan <b>${_students.length}</b> siswa`;
  if (!_students.length) { wrap.innerHTML = `<div class="std-empty">Tidak ada data siswa.</div>`; return; }
  wrap.innerHTML = `
    <table class="std-table">
      <thead><tr>
        <th>Student ID</th><th>Nama</th><th>NIS</th><th>NISN</th><th>Kelas</th><th>JK</th><th>No HP Ortu</th><th>Status</th><th>Aksi</th>
      </tr></thead>
      <tbody>${_students.map((s) => `
        <tr>
          <td>${esc(s.student_id)}</td>
          <td><b>${esc(s.student_name)}</b></td>
          <td>${esc(s.nis || "-")}</td>
          <td>${esc(s.nisn || "-")}</td>
          <td>${esc(s.class_id || "-")}</td>
          <td>${esc(s.gender || "-")}</td>
          <td>${esc(s.parent_phone || "-")}</td>
          <td>${s.status_active === "aktif" ? `<span class="std-badge ok">aktif</span>` : `<span class="std-badge bad">nonaktif</span>`}</td>
          <td>
            <button class="std-btn std-btn-warn" data-std-action="edit" data-id="${esc(s.student_id)}">✏️ Edit</button>
            <button class="std-btn std-btn-danger" data-std-action="del" data-id="${esc(s.student_id)}">🗑 Hapus</button>
          </td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}

async function openModal(data) {
  _editingId = data ? data.student_id : null;
  document.getElementById("stdModalTitle").textContent = data ? `✏️ Edit Siswa — ${data.student_name}` : "➕ Tambah Siswa Baru";
  setVal("f_nis", data?.nis || "");
  setVal("f_nisn", data?.nisn || "");
  setVal("f_student_name", data?.student_name || "");
  setVal("f_gender", data?.gender || "");
  setVal("f_class_id", data?.class_id || "");
  setVal("f_birth_place", data?.birth_place || "");
  setVal("f_birth_date", toDateInput(data?.birth_date));
  setVal("f_religion", data?.religion || "");
  setVal("f_entry_year", data?.entry_year || "");
  setVal("f_status_active", data?.status_active || "aktif");
  setVal("f_address", data?.address || "");
  setVal("f_parent_name", data?.parent_name || "");
  setVal("f_parent_phone", data?.parent_phone || "");
  setVal("f_parent_email", data?.parent_email || "");
  setVal("f_parent_relation", data?.parent_relation || "");
  setVal("f_password", "");
  if (data) {
    setVal("f_student_id", data.student_id);
  } else {
    setVal("f_student_id", "");
    try {
      const res = await fetch(`${API_URL}/api/students/generate-id`, { headers: adminHeaders(false) });
      const r = await res.json();
      if (r.success) setVal("f_student_id", r.student_id);
    } catch (e) { /* abaikan */ }
  }
  document.getElementById("stdModalOverlay").style.display = "flex";
}
function toDateInput(v) {
  if (!v) return "";
  const s = String(v);
  if (s.includes("T")) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  }
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : "";
}
function closeModal() {
  document.getElementById("stdModalOverlay").style.display = "none";
  _editingId = null;
}

async function saveStudent() {
  const payload = {
    student_id: val("f_student_id"),
    nis: val("f_nis"),
    nisn: val("f_nisn"),
    student_name: val("f_student_name"),
    gender: val("f_gender"),
    birth_place: val("f_birth_place"),
    birth_date: val("f_birth_date") || null,
    address: val("f_address"),
    religion: val("f_religion"),
    class_id: val("f_class_id"),
    entry_year: val("f_entry_year"),
    status_active: val("f_status_active"),
    parent_name: val("f_parent_name"),
    parent_phone: val("f_parent_phone"),
    parent_email: val("f_parent_email"),
    parent_relation: val("f_parent_relation"),
  };
  const pass = val("f_password");
  if (pass) payload.password = pass;
  if (!payload.student_name || !payload.nisn || !payload.class_id) {
    alert("⚠️ Nama, NISN, dan Kelas wajib diisi.");
    return;
  }
  const btn = document.getElementById("stdSave");
  btn.disabled = true; btn.textContent = "⏳ Menyimpan...";
  try {
    const url = _editingId ? `${API_URL}/api/students/${encodeURIComponent(_editingId)}` : `${API_URL}/api/students`;
    const res = await fetch(url, { method: _editingId ? "PUT" : "POST", headers: adminHeaders(), body: JSON.stringify(payload) });
    const r = await res.json();
    if (!r.success) throw new Error(r.message);
    closeModal();
    loadStudents();
  } catch (e) {
    alert("❌ " + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "💾 Simpan";
  }
}

async function deleteStudent(id, name) {
  if (!confirm(`Hapus siswa "${name}" (${id})?\nTindakan tidak bisa dibatalkan.`)) return;
  try {
    const res = await fetch(`${API_URL}/api/students/${encodeURIComponent(id)}`, { method: "DELETE", headers: adminHeaders() });
    const r = await res.json();
    if (!r.success) throw new Error(r.message);
    loadStudents();
  } catch (e) {
    alert("❌ " + e.message);
  }
}

function injectStdStyles() {
  if (document.getElementById("stdStyles")) return;
  const s = document.createElement("style");
  s.id = "stdStyles";
  s.textContent =
    ".std-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;background:#f8fafc;padding:14px;border-radius:12px;border:1px solid #e2e8f0;}" +
    ".std-input{padding:9px 12px;border:1px solid #cbd5e1;border-radius:9px;font-size:13px;min-width:170px;}" +
    ".std-btn{padding:9px 14px;border:none;border-radius:9px;background:#e2e8f0;font-weight:bold;cursor:pointer;font-size:13px;}" +
    ".std-btn:hover{filter:brightness(.95);}" +
    ".std-btn-primary{background:#2563eb;color:#fff;}" +
    ".std-btn-success{background:#16a34a;color:#fff;}" +
    ".std-btn-warn{background:#f59e0b;color:#fff;}" +
    ".std-btn-danger{background:#dc2626;color:#fff;}" +
    ".std-count{font-size:12px;color:#64748b;margin-bottom:8px;}" +
    ".std-table-wrap{overflow-x:auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;}" +
    ".std-table{width:100%;border-collapse:collapse;font-size:13px;}" +
    ".std-table th{background:#0f172a;color:#fff;padding:10px;text-align:left;white-space:nowrap;}" +
    ".std-table td{padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap;}" +
    ".std-badge{padding:4px 10px;border-radius:999px;font-size:11px;font-weight:bold;}" +
    ".std-badge.ok{background:#dcfce7;color:#166534;}" +
    ".std-badge.bad{background:#fee2e2;color:#991b1b;}" +
    ".std-empty,.std-loading{padding:24px;text-align:center;color:#64748b;}" +
    ".std-alert{padding:14px;background:#fee2e2;color:#991b1b;border-radius:10px;}" +
    ".std-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:flex-start;justify-content:center;z-index:999;padding:24px;overflow:auto;}" +
    ".std-modal{background:#fff;border-radius:16px;max-width:880px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.25);}" +
    ".std-modal-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #e2e8f0;}" +
    ".std-modal-head h3{margin:0;font-size:16px;}" +
    ".std-x{border:none;background:#f1f5f9;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:14px;}" +
    ".std-modal-body{padding:18px 20px;max-height:65vh;overflow:auto;}" +
    ".std-section{font-size:13px;font-weight:bold;color:#1e40af;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 12px;margin:14px 0 10px;}" +
    ".std-section:first-child{margin-top:0;}" +
    ".std-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;}" +
    ".std-label{display:block;font-size:12px;font-weight:bold;color:#334155;margin-bottom:5px;}" +
    ".std-hint{font-size:12px;color:#64748b;align-self:center;}" +
    ".std-modal-foot{display:flex;gap:10px;padding:14px 20px;border-top:1px solid #e2e8f0;}" +
    "@media(max-width:700px){.std-grid{grid-template-columns:1fr;}}";
  document.head.appendChild(s);
}