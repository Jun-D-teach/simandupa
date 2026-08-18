import { API_URL } from "./config";

let _tab = "students";
let _students = [];
let _teachers = [];

export function initAccountManagerPage() {
  injectAMStyles();
  const box = document.getElementById("accountManagerContent");
  if (!box) return;

  box.innerHTML = `
    <div class="am-toolbar">
      <div>
        <button id="amTabStudents" class="am-btn am-active">🎓 Siswa</button>
        <button id="amTabTeachers" class="am-btn">👨‍🏫 Guru</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input id="amNewPassword" class="am-input" placeholder="Password baru (kosong = default12345)" />
        <button id="amBulkReset" class="am-btn am-warn">🔑 Reset Password Terpilih</button>
        <button id="amBulkQr" class="am-btn am-ok">📱 Generate QR Terpilih</button>
        <button id="amReload" class="am-btn">🔄 Muat Ulang</button>
      </div>
    </div>
    <div class="am-note">ℹ️ Password tersimpan <b>terenkripsi (bcrypt)</b> sehingga tidak dapat dilihat — hanya bisa <b>diganti/reset</b>. Setelah reset, bagikan password baru ke orang bersangkutan.</div>
    <div id="amSummary" class="am-summary"></div>
    <div id="amTable" class="am-table-wrap">Memuat data...</div>
  `;

  document.getElementById("amTabStudents").addEventListener("click", () => { _tab = "students"; setActiveTab(); renderTable(); });
  document.getElementById("amTabTeachers").addEventListener("click", () => { _tab = "teachers"; setActiveTab(); renderTable(); });
  document.getElementById("amReload").addEventListener("click", () => loadData());
  document.getElementById("amBulkReset").addEventListener("click", bulkReset);
  document.getElementById("amBulkQr").addEventListener("click", bulkQr);

  box.addEventListener("change", (e) => {
    if (e.target.id === "amCheckAll") {
      document.querySelectorAll(".am-check").forEach((c) => { c.checked = e.target.checked; });
    }
  });

  box.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-am-action]");
    if (!btn) return;
    const { id, name, amAction } = btn.dataset;
    if (amAction === "reset") {
      const pass = prompt(`Password baru untuk ${name} (kosongkan = default12345):`, "");
      if (pass === null) return;
      await callReset([id], pass);
    }
        if (amAction === "logs") {
      showStudentLogs(id, name);
      return;
    }
    if (amAction === "qr") {
      btn.disabled = true;
      const r = await postJson(`${API_URL}/api/students/generate-qr-bulk`, { ids: [id] });
      btn.disabled = false;
      alert(r.success ? "✅ " + r.message : "❌ " + r.message);
      loadData();
    }
  });

  loadData();
}

function adminHeaders(withJson = true) {
  const h = { "x-admin-key": localStorage.getItem("simAdminKey") || "" };
  if (withJson) h["Content-Type"] = "application/json";
  return h;
}

async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", headers: adminHeaders(), body: JSON.stringify(body) });
  return res.json();
}

async function loadData() {
  const wrap = document.getElementById("amTable");
  wrap.innerHTML = "Memuat data...";
  try {
    const [rs, rt] = await Promise.all([
      fetch(`${API_URL}/api/students`, { headers: adminHeaders(false) }).then((r) => r.json()),
      fetch(`${API_URL}/api/teachers`, { headers: adminHeaders(false) }).then((r) => r.json()),
    ]);
    _students = rs.data || [];
    _teachers = rt.data || [];
    renderSummary();
    renderTable();
  } catch (err) {
    wrap.innerHTML = `<div class="am-alert">❌ Gagal memuat data: ${esc(err.message)}</div>`;
  }
}

function renderSummary() {
  const qrBelum = _students.filter((s) => !s.qr_code).length;
  const noUser = _students.filter((s) => !s.username).length + _teachers.filter((t) => !t.username).length;
  document.getElementById("amSummary").innerHTML = `
    <div class="am-card" style="background:#e0f2fe;"><b>Total Siswa</b><span>${_students.length}</span></div>
    <div class="am-card" style="background:#dcfce7;"><b>Total Guru</b><span>${_teachers.length}</span></div>
    <div class="am-card" style="background:#fef9c3;"><b>QR Belum Ada</b><span>${qrBelum}</span></div>
    <div class="am-card" style="background:#fee2e2;"><b>Username Kosong</b><span>${noUser}</span></div>
  `;
}

function setActiveTab() {
  document.getElementById("amTabStudents").classList.toggle("am-active", _tab === "students");
  document.getElementById("amTabTeachers").classList.toggle("am-active", _tab === "teachers");
  document.getElementById("amBulkQr").style.display = _tab === "students" ? "" : "none";
}

function getSelected() {
  return [...document.querySelectorAll(".am-check:checked")].map((c) => c.dataset.id);
}

function renderTable() {
  const wrap = document.getElementById("amTable");
  const rows = _tab === "students" ? _students : _teachers;
  if (!rows.length) { wrap.innerHTML = `<div class="am-empty">Tidak ada data.</div>`; return; }
  wrap.innerHTML = `
    <table class="am-table">
      <thead><tr>
        <th><input type="checkbox" id="amCheckAll" /></th>
        <th>ID</th><th>Nama</th><th>${_tab === "students" ? "Kelas" : "NIP"}</th>
        <th>Username</th><th>Password</th>${_tab === "students" ? "<th>QR</th>" : ""}<th>Aksi</th>
      </tr></thead>
      <tbody>
        ${rows.map((r) => {
          const id = _tab === "students" ? r.student_id : r.teacher_id;
          const name = _tab === "students" ? r.student_name : r.teacher_name;
          const col = _tab === "students" ? (r.class_id || "-") : (r.nip || "-");
          return `
          <tr>
            <td><input type="checkbox" class="am-check" data-id="${esc(id)}" /></td>
            <td>${esc(id)}</td>
            <td><b>${esc(name)}</b></td>
            <td>${esc(col)}</td>
            <td>${esc(r.username || "❌ belum ada")}</td>
            <td><span class="am-badge am-lock">🔒 terenkripsi</span></td>
            ${_tab === "students" ? `<td>${r.qr_code ? `<span class="am-badge am-ok">✅ ada</span>` : `<span class="am-badge am-warn">⚠️ belum</span>`}</td>` : ""}
            <td>
              <button class="am-btn am-warn" data-am-action="reset" data-id="${esc(id)}" data-name="${esc(name)}">🔑 Reset</button>
              ${_tab === "students" ? `<button class="am-btn am-ok" data-am-action="qr" data-id="${esc(id)}" data-name="${esc(name)}">📱 QR</button><button class="am-btn" data-am-action="logs" data-id="${esc(id)}" data-name="${esc(name)}">📜 Log</button>` : ""}
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

async function callReset(ids, password) {
  const url = _tab === "students" ? `${API_URL}/api/students/reset-passwords` : `${API_URL}/api/teachers/reset-passwords`;
  const r = await postJson(url, { ids, password });
  alert(r.success ? "✅ " + r.message : "❌ " + r.message);
}

async function bulkReset() {
  const ids = getSelected();
  if (!ids.length) return alert("⚠️ Centang minimal 1 baris.");
  const pass = document.getElementById("amNewPassword").value.trim();
  const label = _tab === "students" ? "siswa" : "guru";
  if (!confirm(`Reset password ${ids.length} ${label} menjadi "${pass || "default12345"}"?`)) return;
  await callReset(ids, pass);
}

async function bulkQr() {
  if (_tab !== "students") return alert("ℹ️ Generate QR hanya untuk siswa.");
  const ids = getSelected();
  if (!ids.length) return alert("⚠️ Centang minimal 1 siswa.");
  if (!confirm(`Generate QR Code untuk ${ids.length} siswa?`)) return;
  const btn = document.getElementById("amBulkQr");
  btn.disabled = true; btn.textContent = "⏳ Membuat QR...";
  const r = await postJson(`${API_URL}/api/students/generate-qr-bulk`, { ids });
  btn.disabled = false; btn.textContent = "📱 Generate QR Terpilih";
  alert(r.success ? "✅ " + r.message : "❌ " + r.message);
  loadData();
}

function esc(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
async function showStudentLogs(id, name) {
  try {
    const res = await fetch(`${API_URL}/api/admin/student-logs?studentId=${encodeURIComponent(id)}&limit=300`, { headers: adminHeaders(false) });
    const result = await res.json();
    const logs = result.data || [];
    const win = window.open("", "_blank", "width=980,height=640");
    if (!win) return alert("⚠️ Pop-up diblokir browser. Izinkan pop-up untuk melihat log.");
    win.document.write(`<!DOCTYPE html><html><head><title>Log ${esc(name)}</title><style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111827;}
      h2{margin:0 0 4px;} p.sub{margin:0 0 14px;color:#64748b;font-size:13px;}
      table{border-collapse:collapse;width:100%;} th,td{border:1px solid #d1d5db;padding:6px 8px;font-size:12px;text-align:left;vertical-align:top;}
      th{background:#0f172a;color:#fff;} tr:nth-child(even){background:#f9fafb;}
      .act{font-weight:bold;text-transform:uppercase;}
    </style></head><body>
      <h2>📜 Log Aktivitas Siswa</h2>
      <p class="sub"><b>${esc(name)}</b> — ${esc(id)} • ${logs.length} catatan</p>
      ${logs.length ? `<table><thead><tr><th>Waktu</th><th>Aksi</th><th>Kolom</th><th>Nilai Lama</th><th>Nilai Baru</th><th>IP</th></tr></thead><tbody>
        ${logs.map((l) => `<tr><td>${esc(l.created_at)}</td><td class="act">${esc(l.action)}</td><td>${esc(l.field_name || "-")}</td><td>${esc(l.old_value || "-")}</td><td>${esc(l.new_value || "-")}</td><td>${esc(l.ip_address || "-")}</td></tr>`).join("")}
      </tbody></table>` : "<p>Belum ada log untuk siswa ini.</p>"}
    </body></html>`);
    win.document.close();
  } catch (e) {
    alert("❌ Gagal memuat log: " + e.message);
  }
}
function injectAMStyles() {
  if (document.getElementById("amStyles")) return;
  const s = document.createElement("style");
  s.id = "amStyles";
  s.textContent = `
    .am-toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;background:#f8fafc;padding:14px;border-radius:12px;border:1px solid #e2e8f0;}
    .am-btn{padding:9px 14px;border:none;border-radius:9px;background:#e2e8f0;font-weight:bold;cursor:pointer;font-size:13px;}
    .am-btn:hover{filter:brightness(.95);}
    .am-active{background:#2563eb;color:#fff;}
    .am-warn{background:#f59e0b;color:#fff;}
    .am-ok{background:#16a34a;color:#fff;}
    .am-input{padding:9px 12px;border:1px solid #cbd5e1;border-radius:9px;font-size:13px;min-width:230px;}
    .am-note{background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px;}
    .am-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px;}
    .am-card{padding:12px;border-radius:12px;text-align:center;}
    .am-card b{display:block;font-size:12px;color:#334155;margin-bottom:4px;}
    .am-card span{font-size:22px;font-weight:bold;color:#0f172a;}
    .am-table-wrap{overflow-x:auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;}
    .am-table{width:100%;border-collapse:collapse;font-size:13px;}
    .am-table th{background:#0f172a;color:#fff;padding:10px;text-align:left;white-space:nowrap;}
    .am-table td{padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap;}
    .am-badge{padding:4px 10px;border-radius:999px;font-size:11px;font-weight:bold;}
    .am-ok{background:#dcfce7;color:#166534;} .am-warn{background:#fef9c3;color:#854d0e;}
    .am-lock{background:#e2e8f0;color:#334155;}
    .am-empty{padding:24px;text-align:center;color:#64748b;}
    .am-alert{padding:14px;background:#fee2e2;color:#991b1b;border-radius:10px;}
    .am-table .am-btn{padding:5px 10px;font-size:11px;margin:2px;}
  `;
  document.head.appendChild(s);
}