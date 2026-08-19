import { API_URL } from "./config";

let autoRefreshTimer = null;
let _cache = null;
let _sortKey = "name";
let _sortDir = 1;

export function initMonitoringPage() {
  injectMonitoringStyles();
  const box = document.getElementById("monitoringPageContent");
  if (!box) return;

  box.innerHTML = `<div class="mon-toolbar">
    <div><label class="mon-label">Tanggal</label><br/>
      <input type="date" id="monDate" class="mon-input" value="${todayYmd()}" /></div>
    <div><label class="mon-label">Kelas</label><br/>
      <select id="monClass" class="mon-input"><option value="">Semua Kelas</option></select></div>
    <div><label class="mon-label">Tampilan</label><br/>
      <select id="monView" class="mon-input">
        <option value="semua">Semua Siswa</option>
        <option value="belum_masuk">❌ Belum Absen Masuk</option>
        <option value="belum_pulang">🏠 Belum Absen Pulang</option>
        <option value="tidak_hadir">🚫 Tidak Hadir</option>
      </select></div>
    <div style="align-self:end;"><button id="monRefreshBtn" class="mon-btn-primary">🔄 Muat Data</button></div>
  </div>
  <div class="mon-note-sort">ℹ️ Klik judul kolom (⇅) untuk mengurutkan ▲ naik / ▼ turun.</div>
  <div id="monSummary" class="mon-summary"></div>
  <div id="monTable" class="mon-table-wrap">Memuat data...</div>`;

  document.getElementById("monRefreshBtn").addEventListener("click", () => loadMonitoring());
  document.getElementById("monDate").addEventListener("change", () => loadMonitoring());
  document.getElementById("monClass").addEventListener("change", () => loadMonitoring());
  document.getElementById("monView").addEventListener("change", renderFromCache);

  // Tombol kirim WA manual
  box.addEventListener("click", async (e) => {
    const btn = e.target.closest(".mon-btn-wa");
    if (!btn) return;
    const { student, name, type } = btn.dataset;
    const label = type === "sangat_terlambat" ? "HADIR tetapi SANGAT TERLAMBAT" : "TIDAK HADIR";
    if (!confirm(`Kirim WA ke orang tua ${name}?\nIsi pesan: siswa ${label}.`)) return;
    const old = btn.textContent;
    btn.disabled = true; btn.textContent = "⏳ Antre...";
    try {
      const res = await fetch(`${API_URL}/api/monitoring/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": localStorage.getItem("simAdminKey") || "" },
        body: JSON.stringify({ student_id: student, notify_type: type, sender_type: "admin" })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || "Gagal");
      alert("✅ " + result.message);
      await loadMonitoring(true);
      renderFromCache();
    } catch (err) {
      alert("❌ " + err.message);
      btn.disabled = false; btn.textContent = old;
    }
  });

  // ✅ Klik judul kolom => urutkan
  box.addEventListener("click", (e) => {
    const th = e.target.closest("[data-sort]");
    if (!th) return;
    const key = th.dataset.sort;
    if (_sortKey === key) { _sortDir *= -1; } else { _sortKey = key; _sortDir = 1; }
    renderFromCache();
  });

  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => loadMonitoring(true), 60000);
  loadMonitoring();
}

async function loadMonitoring(silent = false) {
  const date = document.getElementById("monDate").value || todayYmd();
  const classId = document.getElementById("monClass").value;
  const tableBox = document.getElementById("monTable");
  if (!silent) tableBox.innerHTML = "Memuat data...";
  try {
    const res = await fetch(`${API_URL}/api/admin/monitoring?date=${date}&classId=${encodeURIComponent(classId)}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.message || "Gagal memuat");
    _cache = result;
    fillClassOptions(result.students);
    renderFromCache();
  } catch (err) {
    tableBox.innerHTML = `<div class="mon-alert">❌ ${escapeHtml(err.message)}</div>`;
  }
}

function fillClassOptions(students) {
  const sel = document.getElementById("monClass");
  const current = sel.value;
  const classes = [...new Set(students.map((s) => s.class_id))].sort();
  sel.innerHTML = `<option value="">Semua Kelas</option>` + classes.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  sel.value = classes.includes(current) ? current : "";
}

function renderFromCache() {
  if (!_cache) return;
  const view = document.getElementById("monView").value;
  let students = _cache.students || [];
  if (view === "belum_masuk") students = students.filter((s) => !s.jam_masuk && !s.jam_tidak_hadir);
  if (view === "belum_pulang") students = students.filter((s) => s.jam_masuk && !s.jam_pulang);
  if (view === "tidak_hadir") students = students.filter((s) => s.jam_tidak_hadir);
  students = sortStudents(students);
  renderSummary(_cache.summary || {});
  renderTable(students);
}

// ✅ Nilai pembanding untuk tiap kolom yang bisa diurutkan
function sortStudents(list) {
  const val = (s) => {
    switch (_sortKey) {
      case "id": return String(s.student_id || "").toLowerCase();
      case "name": return String(s.student_name || "").toLowerCase();
      case "class": return String(s.class_id || "").toLowerCase();
      case "status": return statusLabel(s);
      case "masuk": return s.jam_masuk ? String(s.jam_masuk) : "99";
      case "pulang": return s.jam_pulang ? "1_" + String(s.jam_pulang) : (s.jam_masuk ? "8" : "9");
      case "jam_pulang": return s.jam_pulang ? String(s.jam_pulang) : "99";
      default: return String(s.student_name || "").toLowerCase();
    }
  };
  return [...list].sort((a, b) => {
    const av = val(a), bv = val(b);
    if (av < bv) return -1 * _sortDir;
    if (av > bv) return 1 * _sortDir;
    return 0;
  });
}

function statusLabel(s) {
  if (s.jam_masuk) return String(s.status_masuk || "hadir");
  if (s.jam_tidak_hadir) return "tidak hadir";
  return "~belum"; // supaya "belum" selalu paling bawah saat urut naik
}

function thSort(key, label) {
  const arrow = _sortKey === key ? (_sortDir === 1 ? " ▲" : " ▼") : " ⇅";
  return `<th class="mon-th-sort" data-sort="${key}">${label}${arrow}</th>`;
}

function renderSummary(sum) {
  document.getElementById("monSummary").innerHTML = `<div class="mon-card" style="background:#e0f2fe;"><b>Total Siswa</b><span>${sum.total || 0}</span></div> <div class="mon-card" style="background:#dcfce7;"><b>Sudah Masuk</b><span>${sum.sudah_masuk || 0}</span></div> <div class="mon-card" style="background:#fee2e2;"><b>Belum Masuk</b><span>${sum.belum_masuk || 0}</span></div> <div class="mon-card" style="background:#e5e7eb;"><b>Tidak Hadir</b><span>${sum.tidak_hadir || 0}</span></div> <div class="mon-card" style="background:#fce7f3;"><b>Sudah Pulang</b><span>${sum.sudah_pulang || 0}</span></div> <div class="mon-card" style="background:#fef9c3;"><b>Terlambat</b><span>${sum.terlambat || 0}</span></div>`;
}

function renderTable(students) {
  const box = document.getElementById("monTable");
  if (!students.length) { box.innerHTML = `<div class="mon-empty">Tidak ada data untuk tampilan ini.</div>`; return; }
  box.innerHTML = `<table class="mon-table">
    <thead><tr>
      <th>No</th>
      ${thSort("id", "ID")}
      ${thSort("name", "Nama")}
      ${thSort("class", "Kelas")}
      <th>NIS</th>
      ${thSort("status", "Status Masuk")}
      ${thSort("masuk", "Jam Masuk")}
      ${thSort("pulang", "Pulang")}
      ${thSort("jam_pulang", "Jam Pulang")}
      <th>Aksi WA</th>
    </tr></thead>
    <tbody>${students.map((s, i) => `<tr class="${!s.jam_masuk && !s.jam_tidak_hadir ? "mon-row-danger" : ""}">
      <td>${i + 1}</td>
      <td>${escapeHtml(s.student_id || "-")}</td>
      <td><b>${escapeHtml(s.student_name)}</b></td>
      <td>${escapeHtml(s.class_id || "-")}</td>
      <td>${escapeHtml(s.nis || "-")}</td>
      <td>${masukBadge(s)}</td>
      <td>${escapeHtml(s.jam_masuk || "-")}</td>
      <td>${s.jam_pulang ? `<span class="mon-badge mon-ok">PULANG</span>` : s.jam_masuk ? `<span class="mon-badge mon-warn">BELUM</span>` : "-"}</td>
      <td>${escapeHtml(s.jam_pulang || "-")}</td>
      <td>${!s.jam_masuk && !s.jam_tidak_hadir ? `<button class="mon-btn-wa mon-wa-st" data-student="${escapeHtml(s.student_id)}" data-name="${escapeHtml(s.student_name)}" data-type="sangat_terlambat">📩 Hadir (Sangat Terlambat)</button> <button class="mon-btn-wa mon-wa-th" data-student="${escapeHtml(s.student_id)}" data-name="${escapeHtml(s.student_name)}" data-type="tidak_hadir">📩 Tidak Hadir</button>` : "-"}</td>
    </tr>`).join("")}</tbody></table>`;
}

function masukBadge(s) {
  if (s.jam_masuk) return badge(s.status_masuk);
  if (s.jam_tidak_hadir) return `<span class="mon-badge mon-bad">TIDAK HADIR</span>`;
  return `<span class="mon-badge mon-bad">BELUM</span>`;
}

function badge(status) {
  const cls = status === "hadir" ? "mon-ok" : status === "terlambat" ? "mon-warn" : "mon-bad";
  return `<span class="mon-badge ${cls}">${escapeHtml(String(status || "-").toUpperCase())}</span>`;
}

function todayYmd() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function escapeHtml(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function injectMonitoringStyles() {
  if (document.getElementById("monitoringStyles")) return;
  const style = document.createElement("style");
  style.id = "monitoringStyles";
  style.textContent = `.mon-toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin-bottom:12px;background:#f8fafc;padding:14px;border-radius:12px;border:1px solid #e2e8f0;}
  .mon-note-sort{background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:8px 14px;border-radius:10px;font-size:12px;margin-bottom:14px;}
  .mon-label{font-size:12px;font-weight:bold;color:#334155;}
  .mon-input{padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;}
  .mon-btn-primary{padding:10px 16px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;}
  .mon-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;}
  .mon-card{padding:14px;border-radius:12px;text-align:center;}
  .mon-card b{display:block;font-size:12px;color:#334155;margin-bottom:6px;}
  .mon-card span{font-size:24px;font-weight:bold;color:#0f172a;}
  .mon-table-wrap{overflow-x:auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;}
  .mon-table{width:100%;border-collapse:collapse;font-size:13px;}
  .mon-table th{background:#0f172a;color:#fff;padding:10px;text-align:left;white-space:nowrap;}
  .mon-th-sort{cursor:pointer;}
  .mon-th-sort:hover{background:#1e293b;}
  .mon-table td{padding:9px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap;}
  .mon-row-danger{background:#fef2f2;}
  .mon-badge{padding:4px 10px;border-radius:999px;font-size:11px;font-weight:bold;}
  .mon-ok{background:#dcfce7;color:#166534;}
  .mon-warn{background:#fef9c3;color:#854d0e;}
  .mon-bad{background:#fee2e2;color:#991b1b;}
  .mon-btn-wa{border:none;border-radius:8px;padding:6px 10px;color:#fff;cursor:pointer;font-size:11px;font-weight:bold;margin:2px;}
  .mon-wa-st{background:#16a34a;}
  .mon-wa-th{background:#dc2626;}
  .mon-btn-wa:disabled{opacity:.5;cursor:wait;}
  .mon-empty{padding:24px;text-align:center;color:#64748b;}
  .mon-alert{padding:14px;background:#fee2e2;color:#991b1b;border-radius:10px;}`;
  document.head.appendChild(style);
}