import { API_URL } from "./config";

let _tab = "students";
let _students = [];
let _teachers = [];
let _search = "";
let _filterClass = "";
let _filterRole = "";
let _sortKey = "name";
let _sortDir = 1;

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
        <input id="amSearch" class="am-input" style="min-width:200px;" placeholder="🔍 Cari nama / ID / NISN / username..." />
        <select id="amFilterClass" class="am-input"><option value="">Semua Kelas</option></select>
        <select id="amFilterRole" class="am-input" style="display:none;"><option value="">Semua Role</option></select>
        <input id="amNewPassword" class="am-input" placeholder="Password baru (kosong = default12345)" />
        <button id="amBulkReset" class="am-btn am-warn">🔑 Reset Password Terpilih</button>
        <button id="amBulkQr" class="am-btn am-ok">📱 Generate QR Terpilih</button>
        <button id="amPrintQr" class="am-btn">🖨️ Cetak Kartu QR</button>
        <button id="amReload" class="am-btn">🔄 Muat Ulang</button>
      </div>
    </div>
    <div class="am-note">ℹ️ Klik judul kolom (⇅) untuk mengurutkan ▲/▼. Password terenkripsi — hanya bisa di-reset.</div>
    <div id="amSummary" class="am-summary"></div>
    <div id="amTable" class="am-table-wrap">Memuat data...</div>
  `;

  document.getElementById("amTabStudents").addEventListener("click", () => { _tab = "students"; setActiveTab(); renderTable(); });
  document.getElementById("amTabTeachers").addEventListener("click", () => { _tab = "teachers"; setActiveTab(); renderTable(); });
  document.getElementById("amReload").addEventListener("click", () => loadData());
  document.getElementById("amBulkReset").addEventListener("click", bulkReset);
  document.getElementById("amBulkQr").addEventListener("click", bulkQr);
  document.getElementById("amPrintQr").addEventListener("click", printQrCards);
  document.getElementById("amSearch").addEventListener("input", (e) => { _search = e.target.value.trim(); renderTable(); });
  document.getElementById("amFilterClass").addEventListener("change", (e) => { _filterClass = e.target.value; renderTable(); });
  document.getElementById("amFilterRole").addEventListener("change", (e) => { _filterRole = e.target.value; renderTable(); });

  box.addEventListener("change", (e) => {
    if (e.target.id === "amCheckAll") {
      document.querySelectorAll(".am-check").forEach((c) => { c.checked = e.target.checked; });
    }
  });

  // Klik judul kolom => urutkan
  box.addEventListener("click", (e) => {
    const th = e.target.closest("[data-sort]");
    if (!th) return;
    const key = th.dataset.sort;
    if (_sortKey === key) { _sortDir *= -1; } else { _sortKey = key; _sortDir = 1; }
    renderTable();
  });

  // Tombol aksi per baris
  box.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-am-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const amAction = btn.dataset.amAction;
    if (amAction === "reset") {
      const pass = prompt("Password baru untuk " + name + " (kosongkan = default12345):", "");
      if (pass === null) return;
      await callReset([id], pass);
    }
    if (amAction === "logs") { showStudentLogs(id, name); return; }
    if (amAction === "qr") {
      btn.disabled = true;
      const r = await postJson(API_URL + "/api/students/generate-qr-bulk", { ids: [id] });
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
      fetch(API_URL + "/api/students", { headers: adminHeaders(false) }).then((r) => r.json()),
      fetch(API_URL + "/api/teachers", { headers: adminHeaders(false) }).then((r) => r.json()),
    ]);
    _students = rs.data || [];
    _teachers = rt.data || [];
    renderSummary();
    fillFilterOptions();
    renderTable();
  } catch (err) {
    wrap.innerHTML = '<div class="am-alert">❌ Gagal memuat data: ' + esc(err.message) + "</div>";
  }
}

function fillFilterOptions() {
  const selClass = document.getElementById("amFilterClass");
  const curC = selClass.value;
  const classes = [...new Set(_students.map((s) => s.class_id).filter(Boolean))].sort();
  selClass.innerHTML = '<option value="">Semua Kelas</option>' + classes.map((c) => '<option value="' + esc(c) + '">' + esc(c) + "</option>").join("");
  if (classes.includes(curC)) selClass.value = curC;

  const selRole = document.getElementById("amFilterRole");
  const curR = selRole.value;
  const roles = [...new Set(_teachers.flatMap((t) => String(t.roles || "").split(",")).map((r) => r.trim()).filter(Boolean))].sort();
  selRole.innerHTML = '<option value="">Semua Role</option>' + roles.map((r) => '<option value="' + esc(r) + '">' + esc(r) + "</option>").join("");
  if (roles.includes(curR)) selRole.value = curR;
}

function renderSummary() {
  const qrBelum = _students.filter((s) => !s.qr_code).length;
  const noUser = _students.filter((s) => !s.username).length + _teachers.filter((t) => !t.username).length;
  document.getElementById("amSummary").innerHTML =
    '<div class="am-card" style="background:#e0f2fe;"><b>Total Siswa</b><span>' + _students.length + "</span></div>" +
    '<div class="am-card" style="background:#dcfce7;"><b>Total Guru</b><span>' + _teachers.length + "</span></div>" +
    '<div class="am-card" style="background:#fef9c3;"><b>QR Belum Ada</b><span>' + qrBelum + "</span></div>" +
    '<div class="am-card" style="background:#fee2e2;"><b>Username Kosong</b><span>' + noUser + "</span></div>";
}

function setActiveTab() {
  document.getElementById("amTabStudents").classList.toggle("am-active", _tab === "students");
  document.getElementById("amTabTeachers").classList.toggle("am-active", _tab === "teachers");
  document.getElementById("amBulkQr").style.display = _tab === "students" ? "" : "none";
  document.getElementById("amPrintQr").style.display = _tab === "students" ? "" : "none";
}

function getSelected() {
  return [...document.querySelectorAll(".am-check:checked")].map((c) => c.dataset.id);
}

function thSort(key, label) {
  const arrow = _sortKey === key ? (_sortDir === 1 ? " ▲" : " ▼") : " ⇅";
  return '<th class="am-th-sort" data-sort="' + key + '" style="cursor:pointer;">' + label + arrow + "</th>";
}

function getFilteredRows() {
  const q = _search.toLowerCase();
  let rows = _tab === "students" ? _students : _teachers;
  rows = rows.filter((r) => {
    if (_tab === "students") {
      const matchQ = !q || [r.student_id, r.student_name, r.nis, r.nisn, r.username].some((v) => String(v || "").toLowerCase().includes(q));
      const matchC = !_filterClass || r.class_id === _filterClass;
      return matchQ && matchC;
    }
    const matchQ = !q || [r.teacher_id, r.teacher_name, r.nip, r.username, r.email].some((v) => String(v || "").toLowerCase().includes(q));
    const matchR = !_filterRole || String(r.roles || "").split(",").map((x) => x.trim()).includes(_filterRole);
    return matchQ && matchR;
  });
  const keyFn = (r) => {
    if (_sortKey === "id") return String(_tab === "students" ? r.student_id : r.teacher_id || "").toLowerCase();
    if (_sortKey === "col") return String(_tab === "students" ? r.class_id : r.nip || "").toLowerCase();
    if (_sortKey === "username") return String(r.username || "").toLowerCase();
    return String(_tab === "students" ? r.student_name : r.teacher_name || "").toLowerCase();
  };
  return [...rows].sort((a, b) => {
    const av = keyFn(a), bv = keyFn(b);
    if (av < bv) return -1 * _sortDir;
    if (av > bv) return 1 * _sortDir;
    return 0;
  });
}

function renderTable() {
  const wrap = document.getElementById("amTable");
  document.getElementById("amFilterClass").style.display = _tab === "students" ? "" : "none";
  document.getElementById("amFilterRole").style.display = _tab === "teachers" ? "" : "none";
  const rows = getFilteredRows();
  const totalAll = _tab === "students" ? _students.length : _teachers.length;
  if (!rows.length) {
    wrap.innerHTML = '<div class="am-empty">Tidak ada data yang cocok.</div>';
    return;
  }
  const head =
    "<thead><tr>" +
    '<th><input type="checkbox" id="amCheckAll" /></th>' +
    thSort("id", "ID") +
    thSort("name", "Nama") +
    thSort("col", _tab === "students" ? "Kelas" : "NIP") +
    thSort("username", "Username") +
    "<th>Password</th>" +
    (_tab === "students" ? "<th>QR</th>" : "") +
    "<th>Aksi</th>" +
    "</tr></thead>";
  const body =
    "<tbody>" +
    rows.map((r) => {
      const id = _tab === "students" ? r.student_id : r.teacher_id;
      const name = _tab === "students" ? r.student_name : r.teacher_name;
      const col = _tab === "students" ? (r.class_id || "-") : (r.nip || "-");
      const qrCell = _tab === "students"
        ? "<td>" + (r.qr_code ? '<span class="am-badge am-ok">✅ ada</span>' : '<span class="am-badge am-warn">⚠️ belum</span>') + "</td>"
        : "";
      const extraBtns = _tab === "students"
        ? '<button class="am-btn am-ok" data-am-action="qr" data-id="' + esc(id) + '" data-name="' + esc(name) + '">📱 QR</button>' +
          '<button class="am-btn" data-am-action="logs" data-id="' + esc(id) + '" data-name="' + esc(name) + '">📜 Log</button>'
        : "";
      return (
        "<tr>" +
        '<td><input type="checkbox" class="am-check" data-id="' + esc(id) + '" /></td>' +
        "<td>" + esc(id) + "</td>" +
        "<td><b>" + esc(name) + "</b></td>" +
        "<td>" + esc(col) + "</td>" +
        "<td>" + esc(r.username || "❌ belum ada") + "</td>" +
        '<td><span class="am-badge am-lock">🔒 terenkripsi</span></td>' +
        qrCell +
        "<td>" +
        '<button class="am-btn am-warn" data-am-action="reset" data-id="' + esc(id) + '" data-name="' + esc(name) + '">🔑 Reset</button>' +
        extraBtns +
        "</td></tr>"
      );
    }).join("") +
    "</tbody>";
  wrap.innerHTML =
    '<div style="padding:8px 12px;font-size:12px;color:#64748b;">Menampilkan <b>' + rows.length + "</b> dari <b>" + totalAll + "</b> " + (_tab === "students" ? "siswa" : "guru") + " — klik judul kolom untuk mengurutkan</div>" +
    '<table class="am-table">' + head + body + "</table>";
}

async function callReset(ids, password) {
  const url = _tab === "students" ? API_URL + "/api/students/reset-passwords" : API_URL + "/api/teachers/reset-passwords";
  const r = await postJson(url, { ids, password });
  alert(r.success ? "✅ " + r.message : "❌ " + r.message);
}

async function bulkReset() {
  const ids = getSelected();
  if (!ids.length) return alert("⚠️ Centang minimal 1 baris.");
  const pass = document.getElementById("amNewPassword").value.trim();
  const label = _tab === "students" ? "siswa" : "guru";
  if (!confirm("Reset password " + ids.length + " " + label + ' menjadi "' + (pass || "default12345") + '"?')) return;
  await callReset(ids, pass);
}

async function bulkQr() {
  if (_tab !== "students") return alert("ℹ️ Generate QR hanya untuk siswa.");
  const ids = getSelected();
  if (!ids.length) return alert("⚠️ Centang minimal 1 siswa.");
  if (!confirm("Generate QR Code untuk " + ids.length + " siswa?")) return;
  const btn = document.getElementById("amBulkQr");
  btn.disabled = true; btn.textContent = "⏳ Membuat QR...";
  const r = await postJson(API_URL + "/api/students/generate-qr-bulk", { ids });
  btn.disabled = false; btn.textContent = "📱 Generate QR Terpilih";
  alert(r.success ? "✅ " + r.message : "❌ " + r.message);
  loadData();
}

function esc(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function showStudentLogs(id, name) {
  try {
    const res = await fetch(API_URL + "/api/admin/student-logs?studentId=" + encodeURIComponent(id) + "&limit=300", { headers: adminHeaders(false) });
    const result = await res.json();
    const logs = result.data || [];
    const win = window.open("", "_blank", "width=980,height=640");
    if (!win) return alert("⚠️ Pop-up diblokir browser. Izinkan pop-up untuk melihat log.");
    let rowsHtml = "";
    logs.forEach((l) => {
      rowsHtml += "<tr><td>" + esc(l.created_at) + '</td><td class="act">' + esc(l.action) + "</td><td>" + esc(l.field_name || "-") + "</td><td>" + esc(l.old_value || "-") + "</td><td>" + esc(l.new_value || "-") + "</td><td>" + esc(l.ip_address || "-") + "</td></tr>";
    });
    win.document.write(
      "<!DOCTYPE html><html><head><title>Log " + esc(name) + "</title><style>" +
      "body{font-family:Arial,sans-serif;padding:20px;color:#111827;}" +
      "h2{margin:0 0 4px;}p.sub{margin:0 0 14px;color:#64748b;font-size:13px;}" +
      "table{border-collapse:collapse;width:100%;}th,td{border:1px solid #d1d5db;padding:6px 8px;font-size:12px;text-align:left;vertical-align:top;}" +
      "th{background:#0f172a;color:#fff;}tr:nth-child(even){background:#f9fafb;}.act{font-weight:bold;text-transform:uppercase;}" +
      "</style></head><body>" +
      "<h2>📜 Log Aktivitas Siswa</h2>" +
      '<p class="sub"><b>' + esc(name) + "</b> — " + esc(id) + " • " + logs.length + " catatan</p>" +
      (logs.length
        ? "<table><thead><tr><th>Waktu</th><th>Aksi</th><th>Kolom</th><th>Nilai Lama</th><th>Nilai Baru</th><th>IP</th></tr></thead><tbody>" + rowsHtml + "</tbody></table>"
        : "<p>Belum ada log untuk siswa ini.</p>") +
      "</body></html>"
    );
    win.document.close();
  } catch (e) {
    alert("❌ Gagal memuat log: " + e.message);
  }
}
async function printQrCards() {
  if (_tab !== "students") return alert("ℹ️ Kartu QR hanya untuk siswa.");
  let ids = getSelected();
  const useAll = !ids.length;
  if (useAll && !confirm("Tidak ada siswa yang dicentang. Cetak kartu QR untuk SEMUA siswa?")) return;
  if (useAll) ids = _students.map((s) => s.student_id);

  const chosen = _students.filter((s) => ids.includes(s.student_id));
  const missing = chosen.filter((s) => !s.qr_code);
  if (missing.length) {
    if (confirm(missing.length + " siswa belum punya QR Code. Generate sekarang?")) {
      for (const s of missing) {
        try {
          await fetch(API_URL + "/api/students/" + encodeURIComponent(s.student_id) + "/generate-qr", { method: "POST", headers: adminHeaders() });
        } catch (e) { /* lewati */ }
      }
      await loadData();
    }
  }
  const list = _students.filter((s) => ids.includes(s.student_id));
  const win = window.open("", "_blank", "width=1000,height=700");
  if (!win) return alert("⚠️ Pop-up diblokir browser. Izinkan pop-up untuk mencetak.");
  win.document.write(cardsHtml(list));
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 600);
}

function cardsHtml(list) {
  const cards = list.map((s) =>
    '<div class="card">' +
      '<img src="' + (s.qr_code || "") + '" alt="QR" />' +
      '<div class="info">' +
        '<div class="school">MAN 2 PALEMBANG</div>' +
        '<div class="name">' + esc(s.student_name) + '</div>' +
        '<div class="meta">Kelas: ' + esc(s.class_id || "-") + '</div>' +
        '<div class="meta">NISN: ' + esc(s.nisn || "-") + '</div>' +
        '<div class="meta">ID: ' + esc(s.student_id) + '</div>' +
      '</div>' +
    '</div>'
  ).join("");
  return '<!DOCTYPE html><html><head><title>Kartu QR Siswa</title><style>' +
    'body{font-family:Arial,sans-serif;padding:10mm;color:#111827;}' +
    '.bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:4mm;}' +
    '.bar h2{margin:0;font-size:16px;}' +
    '.bar button{padding:8px 14px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;}' +
    '.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:4mm;}' +
    '.card{border:1.5px dashed #94a3b8;border-radius:12px;padding:4mm;display:flex;gap:4mm;align-items:center;page-break-inside:avoid;}' +
    '.card img{width:32mm;height:32mm;object-fit:contain;background:#fff;}' +
    '.info{flex:1;}' +
    '.school{font-size:9px;font-weight:bold;letter-spacing:1px;color:#1e40af;}' +
    '.name{font-size:13px;font-weight:bold;margin:1mm 0;}' +
    '.meta{font-size:9px;color:#334155;}' +
    '@media print{.bar button{display:none;}}' +
    '@page{size:A4 portrait;margin:8mm;}' +
    '</style></head><body>' +
    '<div class="bar"><h2>Kartu QR Absensi — MAN 2 Palembang (' + list.length + ' siswa)</h2><button onclick="window.print()">🖨️ Cetak</button></div>' +
    '<div class="cards">' + cards + '</div>' +
    '</body></html>';
}
function injectAMStyles() {
  if (document.getElementById("amStyles")) return;
  const s = document.createElement("style");
  s.id = "amStyles";
  s.textContent =
    ".am-toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;background:#f8fafc;padding:14px;border-radius:12px;border:1px solid #e2e8f0;}" +
    ".am-btn{padding:9px 14px;border:none;border-radius:9px;background:#e2e8f0;font-weight:bold;cursor:pointer;font-size:13px;}" +
    ".am-btn:hover{filter:brightness(.95);}" +
    ".am-active{background:#2563eb;color:#fff;}" +
    ".am-warn{background:#f59e0b;color:#fff;}" +
    ".am-ok{background:#16a34a;color:#fff;}" +
    ".am-input{padding:9px 12px;border:1px solid #cbd5e1;border-radius:9px;font-size:13px;min-width:150px;}" +
    ".am-note{background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px;}" +
    ".am-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px;}" +
    ".am-card{padding:12px;border-radius:12px;text-align:center;}" +
    ".am-card b{display:block;font-size:12px;color:#334155;margin-bottom:4px;}" +
    ".am-card span{font-size:22px;font-weight:bold;color:#0f172a;}" +
    ".am-table-wrap{overflow-x:auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;}" +
    ".am-table{width:100%;border-collapse:collapse;font-size:13px;}" +
    ".am-table th{background:#0f172a;color:#fff;padding:10px;text-align:left;white-space:nowrap;}" +
    ".am-th-sort:hover{background:#1e293b;}" +
    ".am-table td{padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap;}" +
    ".am-badge{padding:4px 10px;border-radius:999px;font-size:11px;font-weight:bold;}" +
    ".am-ok-b{background:#dcfce7;color:#166534;}" +
    ".am-warn{background:#fef9c3;color:#854d0e;}" +
    ".am-lock{background:#e2e8f0;color:#334155;}" +
    ".am-empty{padding:24px;text-align:center;color:#64748b;}" +
    ".am-alert{padding:14px;background:#fee2e2;color:#991b1b;border-radius:10px;}" +
    ".am-table .am-btn{padding:5px 10px;font-size:11px;margin:2px;}";
  document.head.appendChild(s);
}