// src/studentPortalPage.js — Portal Siswa: semua kolom tampil, 4 kolom dikunci, perubahan tercatat di log
import { API_URL } from "./config";

function getLoggedStudent() {
  try {
    return JSON.parse(localStorage.getItem("simStudent") || "null");
  } catch {
    return null;
  }
}

function esc(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function initStudentPortalPage() {
  const student = getLoggedStudent();
  if (!student || !student.student_id) {
    window.location.href = "/?page=student-login";
    return;
  }
  injectSPStyles();
  document.querySelector("#app").innerHTML = `
  <div style="min-height:100vh;background:#eef2f7;font-family:Arial,sans-serif;padding:24px;">
    <div style="max-width:980px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#14532d,#16a34a);color:#fff;border-radius:16px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <h1 style="margin:0;font-size:22px;">🎓 Portal Siswa</h1>
          <p style="margin:4px 0 0;font-size:13px;opacity:.9;">MAN 2 Palembang — kolom bertanda 🔒 tidak dapat diubah.</p>
        </div>
        <button id="spLogout" style="background:#dc2626;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-weight:bold;cursor:pointer;">Logout</button>
      </div>

      <div style="background:#fff;border-radius:16px;padding:24px;margin-top:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);">
        <h2 style="margin:0 0 14px;font-size:17px;">🔖 Profil Lengkap Siswa</h2>
        <div id="spForm" class="sp-grid"><div style="grid-column:1/-1;color:#64748b;text-align:center;">Memuat data...</div></div>
        <div id="spResult" style="margin-top:12px;"></div>
      </div>

      <div style="background:#fff;border-radius:16px;padding:24px;margin-top:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);">
        <h2 style="margin:0 0 14px;font-size:17px;">🔑 Ganti Password</h2>
        <div class="sp-grid">
          <div><label class="sp-label">Password Lama</label><input type="password" id="spOldPass" class="sp-input" /></div>
          <div><label class="sp-label">Password Baru (min. 6 karakter)</label><input type="password" id="spNewPass" class="sp-input" /></div>
        </div>
        <button id="spChangePass" class="sp-save" style="margin-top:12px;">🔑 Ganti Password</button>
        <div id="spPassResult" style="margin-top:10px;"></div>
      </div>
    </div>
  </div>`;

  document.getElementById("spLogout").addEventListener("click", () => {
    localStorage.removeItem("simStudent");
    window.location.href = "/?page=student-login";
  });
  document.getElementById("spChangePass").addEventListener("click", () => changePassword(student));
  loadProfile(student);
}

function roField(label, value) {
  return `<div><label class="sp-label">${label} 🔒</label><input class="sp-input sp-ro" value="${esc(value || "-")}" readonly /></div>`;
}
function edField(label, key, value) {
  return `<div><label class="sp-label">${label}</label><input id="sp_${key}" class="sp-input" value="${esc(value || "")}" /></div>`;
}

async function loadProfile(student) {
  const box = document.getElementById("spForm");
  try {
    const res = await fetch(`${API_URL}/api/students/${student.student_id}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.message || "Gagal memuat data");
    const d = result.data;
    box.innerHTML = `
      ${roField("ID Siswa", d.student_id)}
      ${roField("NIS", d.nis)}
      ${roField("NISN", d.nisn)}
      ${roField("Kelas", d.class_id)}
      ${edField("Nama Lengkap", "student_name", d.student_name)}
      <div><label class="sp-label">Jenis Kelamin</label>
        <select id="sp_gender" class="sp-input">
          <option value="">-</option>
          <option value="L" ${d.gender === "L" ? "selected" : ""}>Laki-laki</option>
          <option value="P" ${d.gender === "P" ? "selected" : ""}>Perempuan</option>
        </select></div>
      ${edField("Tempat Lahir", "birth_place", d.birth_place)}
      <div><label class="sp-label">Tanggal Lahir</label><input type="date" id="sp_birth_date" class="sp-input" value="${esc(String(d.birth_date || "").slice(0, 10))}" /></div>
      ${edField("Agama", "religion", d.religion)}
      ${roField("Tahun Masuk", d.entry_year)}
      <div style="grid-column:1/-1;"><label class="sp-label">Alamat</label><textarea id="sp_address" class="sp-input" rows="2">${esc(d.address || "")}</textarea></div>
      ${edField("Nama Orang Tua/Wali", "parent_name", d.parent_name)}
      ${roField("No. HP Orang Tua", d.parent_phone)}
      ${edField("Email Orang Tua", "parent_email", d.parent_email)}
      <div><label class="sp-label">Hubungan Orang Tua</label>
        <select id="sp_parent_relation" class="sp-input">
          <option value="">-</option>
          <option value="ayah" ${d.parent_relation === "ayah" ? "selected" : ""}>Ayah</option>
          <option value="ibu" ${d.parent_relation === "ibu" ? "selected" : ""}>Ibu</option>
          <option value="wali" ${d.parent_relation === "wali" ? "selected" : ""}>Wali</option>
        </select></div>
      ${roField("Status Siswa", d.status_active)}
      ${roField("Username Login", d.username)}
      ${roField("Terdaftar", d.created_at)}
      ${roField("Update Terakhir", d.updated_at)}
      <div style="grid-column:1/-1;text-align:center;border-top:1px solid #e2e8f0;padding-top:14px;">
        <b>QR Code Siswa</b><br />
        ${d.qr_code ? `<img src="${d.qr_code}" alt="QR" style="width:170px;margin-top:8px;" />` : `<span style="color:#b45309;">QR belum dibuat — hubungi admin.</span>`}
      </div>
      <div style="grid-column:1/-1;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <button id="spSave" class="sp-save">💾 Simpan Perubahan</button>
        <span style="font-size:12px;color:#64748b;">Setiap perubahan tercatat otomatis di log dan dapat dilihat admin.</span>
      </div>
    `;
    document.getElementById("spSave").addEventListener("click", () => saveProfile(student));
  } catch (err) {
    box.innerHTML = `<div class="sp-err">❌ ${esc(err.message)}</div>`;
  }
}

async function saveProfile(student) {
  const v = (id) => (document.getElementById(id)?.value || "").trim();
  const body = {
    student_name: v("sp_student_name"),
    gender: v("sp_gender"),
    birth_place: v("sp_birth_place"),
    birth_date: v("sp_birth_date"),
    address: v("sp_address"),
    religion: v("sp_religion"),
    parent_name: v("sp_parent_name"),
    parent_email: v("sp_parent_email"),
    parent_relation: v("sp_parent_relation"),
  };
  const btn = document.getElementById("spSave");
  const rbox = document.getElementById("spResult");
  btn.disabled = true; btn.textContent = "⏳ Menyimpan...";
  try {
    const res = await fetch(`${API_URL}/api/student/${student.student_id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const r = await res.json();
    rbox.innerHTML = r.success
      ? `<div class="sp-ok">✅ ${esc(r.message)}${r.changes ? ` (${r.changes} perubahan tercatat di log)` : ""}</div>`
      : `<div class="sp-err">❌ ${esc(r.message)}</div>`;
    if (r.success) loadProfile(student);
  } catch (e) {
    rbox.innerHTML = `<div class="sp-err">❌ Gagal koneksi ke server.</div>`;
  } finally {
    btn.disabled = false; btn.textContent = "💾 Simpan Perubahan";
  }
}

async function changePassword(student) {
  const oldp = document.getElementById("spOldPass").value;
  const newp = document.getElementById("spNewPass").value;
  const box = document.getElementById("spPassResult");
  if (!oldp || !newp) { box.innerHTML = `<div class="sp-err">❌ Isi password lama dan baru.</div>`; return; }
  try {
    const res = await fetch(`${API_URL}/api/student/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.student_id, old_password: oldp, new_password: newp }),
    });
    const r = await res.json();
    box.innerHTML = r.success ? `<div class="sp-ok">✅ ${esc(r.message)}</div>` : `<div class="sp-err">❌ ${esc(r.message)}</div>`;
    if (r.success) { document.getElementById("spOldPass").value = ""; document.getElementById("spNewPass").value = ""; }
  } catch (e) {
    box.innerHTML = `<div class="sp-err">❌ Gagal koneksi ke server.</div>`;
  }
}

function injectSPStyles() {
  if (document.getElementById("spStyles")) return;
  const s = document.createElement("style");
  s.id = "spStyles";
  s.textContent = `
    .sp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px;}
    .sp-label{display:block;font-size:12px;font-weight:bold;color:#334155;margin-bottom:5px;}
    .sp-input{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:9px;font-size:14px;box-sizing:border-box;}
    .sp-ro{background:#f1f5f9;color:#64748b;}
    .sp-save{background:#2563eb;color:#fff;border:none;border-radius:10px;padding:11px 18px;font-weight:bold;cursor:pointer;}
    .sp-ok{background:#dcfce7;color:#166534;padding:10px 14px;border-radius:10px;}
    .sp-err{background:#fee2e2;color:#991b1b;padding:10px 14px;border-radius:10px;}
    @media(max-width:700px){.sp-grid{grid-template-columns:1fr;}}
  `;
  document.head.appendChild(s);
}