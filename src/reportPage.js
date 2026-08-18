// src/reportPage.js - Versi baru: wali kelas otomatis + semester & tahun pelajaran berupa pilihan
import { API_URL } from "./config";

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
let _classes = [];
let _settings = {};

export function initReportPage() {
  // Ditunda sesaat agar elemen lama main.js selesai diproses dulu, baru kita ganti formnya
  setTimeout(renderReportForm, 0);
}

function renderReportForm() {
  const mainEl = document.querySelector("main");
  if (!mainEl) return;

  const now = new Date();
  const defSemester = localStorage.getItem("simCurrentSemester") || "Ganjil";
  const defSchoolYear = localStorage.getItem("simCurrentSchoolYear") || "2025/2026";

  // Pilihan tahun pelajaran: 3 tahun sebelum s/d 3 tahun sesudah default
  const baseYear = Number((defSchoolYear.split("/")[0]) || now.getFullYear()) - 3;
  let yearOptions = "";
  for (let y = baseYear; y < baseYear + 7; y++) {
    yearOptions += `<option value="${y}/${y + 1}">${y}/${y + 1}</option>`;
  }

  mainEl.innerHTML = `
  <div style="max-width:920px;margin:24px auto;padding:0 16px;font-family:Arial,sans-serif;">
    <div style="background:#eaf4fd;border:1px solid #dbeafe;border-radius:14px 14px 0 0;padding:20px 24px;">
      <h1 style="margin:0 0 6px;font-size:24px;color:#0f172a;">Cetak Laporan Absensi</h1>
      <p style="margin:0;color:#475569;font-size:14px;">Pilih filter kelas dan periode untuk membuat laporan rekap bulanan siap cetak.</p>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 14px 14px;padding:24px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;">
        <div>
          <label style="font-weight:bold;font-size:14px;display:block;margin-bottom:6px;">Kelas</label>
          <select id="rpClass" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;"><option value="">Memuat kelas...</option></select>
        </div>
        <div>
          <label style="font-weight:bold;font-size:14px;display:block;margin-bottom:6px;">Bulan</label>
          <select id="rpMonth" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;">
            ${BULAN.map((b, i) => `<option value="${i + 1}">${b}</option>`).join("")}
          </select>
        </div>
        <div>
          <label style="font-weight:bold;font-size:14px;display:block;margin-bottom:6px;">Tahun</label>
          <input id="rpYear" type="number" value="${now.getFullYear()}" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;" />
        </div>
        <div>
          <label style="font-weight:bold;font-size:14px;display:block;margin-bottom:6px;">Wali Kelas (otomatis sesuai kelas)</label>
          <input id="rpWali" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;" placeholder="Otomatis terisi, bisa diubah manual" />
          <div id="rpWaliNip" style="font-size:12px;color:#64748b;margin-top:4px;"></div>
        </div>
        <div>
          <label style="font-weight:bold;font-size:14px;display:block;margin-bottom:6px;">Semester</label>
          <select id="rpSemester" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;">
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
        <div>
          <label style="font-weight:bold;font-size:14px;display:block;margin-bottom:6px;">Tahun Pelajaran</label>
          <select id="rpSchoolYear" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;">${yearOptions}</select>
        </div>
      </div>
      <div style="margin-top:18px;background:#eef2ff;border:1px solid #e0e7ff;border-radius:10px;padding:12px 16px;font-size:13px;color:#3730a3;">
        Laporan akan dibuka di tab baru dalam format rekap bulanan per kelas.
      </div>
      <button id="rpPrint" style="margin-top:16px;background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px 22px;font-weight:bold;cursor:pointer;">Cetak Laporan</button>
    </div>
  </div>`;

  // Default nilai
  document.getElementById("rpMonth").value = String(now.getMonth() + 1);
  document.getElementById("rpSemester").value = defSemester;
  document.getElementById("rpSchoolYear").value = defSchoolYear;

  document.getElementById("rpClass").addEventListener("change", autoFillWali);
  document.getElementById("rpPrint").addEventListener("click", printReport);

  loadSettings().finally(() => loadClasses());
}

async function loadSettings() {
  try {
    const res = await fetch(`${API_URL}/api/settings`, {
      headers: { "x-admin-key": localStorage.getItem("simAdminKey") || "" },
    });
    const result = await res.json();
    _settings = result.data || {};
  } catch (e) {
    _settings = {};
  }
}

async function loadClasses() {
  const sel = document.getElementById("rpClass");
  try {
    const res = await fetch(`${API_URL}/api/classes`, {
      headers: { "x-admin-key": localStorage.getItem("simAdminKey") || "" },
    });
    const result = await res.json();
    _classes = result.data || [];
    sel.innerHTML = _classes.length
      ? _classes.map((c) => `<option value="${c.class_id}">${c.class_name || c.class_id}</option>`).join("")
      : `<option value="">Tidak ada kelas</option>`;
    autoFillWali();
  } catch (e) {
    sel.innerHTML = `<option value="">Gagal memuat kelas</option>`;
  }
}

// ✅ Wali kelas + NIP otomatis terisi saat kelas dipilih
function autoFillWali() {
  const classId = document.getElementById("rpClass").value;
  const cls = _classes.find((c) => c.class_id === classId);
  const waliInput = document.getElementById("rpWali");
  const nipBox = document.getElementById("rpWaliNip");
  if (cls && cls.wali_kelas_name) {
    waliInput.value = cls.wali_kelas_name;
    nipBox.textContent = cls.wali_kelas_nip ? `NIP. ${cls.wali_kelas_nip}` : "";
  } else {
    waliInput.value = _settings.default_homeroom_name || "";
    nipBox.textContent = _settings.default_homeroom_nip ? `NIP. ${_settings.default_homeroom_nip}` : "";
  }
}

function printReport() {
  const classId = document.getElementById("rpClass").value;
  const month = document.getElementById("rpMonth").value;
  const year = document.getElementById("rpYear").value;
  const wali = document.getElementById("rpWali").value.trim();
  const semester = document.getElementById("rpSemester").value;
  const tahunPelajaran = document.getElementById("rpSchoolYear").value;

  if (!classId || !month || !year) {
    alert("⚠️ Lengkapi kelas, bulan, dan tahun terlebih dahulu.");
    return;
  }

  const cls = _classes.find((c) => c.class_id === classId) || {};
  const params = new URLSearchParams({
    classId,
    month,
    year,
    waliKelas: wali || _settings.default_homeroom_name || "",
    nipWaliKelas: cls.wali_kelas_nip || _settings.default_homeroom_nip || "",
    kepalaMadrasah: _settings.principal_name || "",
    nipKepalaMadrasah: _settings.principal_nip || "",
    semester,
    tahunPelajaran,
  });

  window.open(`${API_URL}/api/export/report?${params.toString()}`, "_blank");
}