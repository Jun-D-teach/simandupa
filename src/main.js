import "./style.css";
import { loadDashboard, loadClassOptions } from "./dashboard";
import { initScanner } from "./scanner";
import { initImportPage } from "./importPage";
import { initLoginPage, isLoggedIn, logout } from "./loginPage";
import { initReportPage } from "./reportPage";
import { initSettingsPage } from "./settingsPage";
import { initStudentsPage } from "./studentsPage";
import { initStudentLoginPage } from "./studentLoginPage";
import { initStudentPortalPage } from "./studentPortalPage";
import { initClassesPage } from "./classesPage";
import { initTeachersPage } from "./teachersPage";
import { initTeacherLoginPage } from "./teacherLoginPage";
import { initTeacherPortalPage } from "./teacherPortalPage";
import { initImportGuruPage } from "./ImportGuruPage"; // Pastikan nama file sesuai

const params = new URLSearchParams(window.location.search);
const SCANNER_ID = params.get("scanner") || "SCN-001";
const PAGE = params.get("page") || "scanner";
import { API_URL } from "./config";
console.log("Mode halaman:", PAGE);
console.log("Scanner aktif:", SCANNER_ID);

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "/?page=login";
    return false;
  }
  return true;
}

function getCurrentAcademicInfo() {
  const semester = localStorage.getItem("simCurrentSemester") || "-";
  const schoolYear = localStorage.getItem("simCurrentSchoolYear") || "-";
  return { semester, schoolYear };
}

async function syncAcademicInfo() {
  try {
    const response = await fetch(`${API_URL}/api/settings`, {
      headers: {
        "x-admin-key": localStorage.getItem("simAdminKey") || ""
      }
    });

    const result = await response.json();

    if (result.success) {
      const data = result.data || {};
      localStorage.setItem("simCurrentSemester", data.current_semester || "-");
      localStorage.setItem("simCurrentSchoolYear", data.current_school_year || "-");
      localStorage.setItem("simStartTime", data.school_start_time || "07:00");
      localStorage.setItem("simLateTime", data.school_late_time || "07:15");
      localStorage.setItem("simReturnTime", data.school_return_time || "14:00");
      localStorage.setItem("simAttendanceOpenTime", data.attendance_open_time || "06:00");
      localStorage.setItem("simAttendanceCloseReturnTime", data.attendance_close_return_time || "23:00");
      if (data.school_return_time) {
        localStorage.setItem("simReturnTime", data.school_return_time);
      }
    }
  } catch (error) {
    console.error("SYNC ACADEMIC INFO ERROR:", error);
  }
}

function getSidebarLink(targetPage, label, icon) {
  const isActive = PAGE === targetPage;
  const activeStyles = isActive
    ? "background: rgba(59,130,246,0.22); color: white; border: 1px solid rgba(96,165,250,0.35);"
    : "background: rgba(255,255,255,0.04); color: #e2e8f0; border: 1px solid transparent;";

  return `
    <a href="/?page=${targetPage}" class="sidebar-link" style="
      text-decoration:none;
      display:flex;
      align-items:center;
      gap:12px;
      padding:12px 14px;
      border-radius:12px;
      transition:all 0.2s ease;
      ${activeStyles}
    ">
      <span style="font-size:18px; width:24px; text-align:center; flex-shrink:0;">${icon}</span>
      <span class="sidebar-label" style="white-space:nowrap;">${label}</span>
    </a>
  `;
}

function getSidebarLayout(pageTitle, pageDescription, contentHtml) {
  const { semester, schoolYear } = getCurrentAcademicInfo();

  return `
    <div style="font-family: Arial, sans-serif; background: #f5f7fb; min-height: 100vh; display: flex;">
      <aside id="adminSidebar" style="
        width: 270px;
        background: linear-gradient(180deg, #0f172a, #1e293b);
        color: white;
        min-height: 100vh;
        padding: 20px 16px;
        transition: all 0.25s ease;
        box-shadow: 4px 0 20px rgba(0,0,0,0.08);
        position: sticky;
        top: 0;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:24px;">
          <div id="sidebarBrand" style="overflow:hidden;">
            <div style="font-size: 20px; font-weight: bold; white-space: nowrap;">SIM Madrasah</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px; white-space: nowrap;">Admin Panel MAN 2</div>
          </div>
          <button id="toggleSidebarBtn" style="
            border:none;
            background:#334155;
            color:white;
            width:36px;
            height:36px;
            border-radius:10px;
            cursor:pointer;
            flex-shrink:0;
          ">☰</button>
        </div>

        <div style="margin-bottom:18px; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8;">
          Menu Utama
        </div>

        <nav style="display:flex; flex-direction:column; gap:10px;">
          ${getSidebarLink("dashboard", "Dashboard", "📊")}
          ${getSidebarLink("profile", "Profil Madrasah", "🏫")}
          ${getSidebarLink("classes", "Kelas", "🏫")}
          ${getSidebarLink("students", "Siswa", "🎓")}
          ${getSidebarLink("teachers", "Guru", "👨‍🏫")}
          ${getSidebarLink("report", "Laporan", "🧾")}
          ${getSidebarLink("import-guru", "Import Guru", "📤")}
          ${getSidebarLink("import", "Import Siswa", "📥")}
          ${getSidebarLink("settings", "Settings", "⚙️")}
        </nav>

        <div style="margin-top:26px; margin-bottom:18px; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8;">
          Modul Lain
        </div>

        <nav style="display:flex; flex-direction:column; gap:10px;">
          ${getSidebarLink("facilities", "Sarana Prasarana", "🏢")}
          ${getSidebarLink("bk", "BK", "🧠")}
          ${getSidebarLink("scanner", "Scanner", "📷")}
        </nav>

        <div style="margin-top:30px; padding-top:18px; border-top:1px solid rgba(255,255,255,0.12);">
          <button id="logoutBtn" style="
            width:100%;
            padding:12px 14px;
            border:none;
            background:#dc2626;
            color:white;
            border-radius:12px;
            cursor:pointer;
            font-weight:bold;
          ">
            <span class="sidebar-label">Logout</span>
          </button>
        </div>
      </aside>

      <main style="flex:1; min-width:0;">
        <div style="padding: 24px;">
          <div style="
            background: white;
            border-radius: 20px;
            box-shadow: 0 12px 30px rgba(15,23,42,0.07);
            overflow: hidden;
          ">
            <div style="
              padding: 24px 28px;
              background: linear-gradient(135deg, #eff6ff, #ecfeff);
              border-bottom: 1px solid #e5e7eb;
            ">
              <h1 style="margin:0; font-size:28px; color:#0f172a;">${pageTitle}</h1>
              <p style="margin:8px 0 0; color:#64748b;">${pageDescription}</p>

              <div style="
                margin-top:16px;
                display:flex;
                gap:10px;
                flex-wrap:wrap;
              ">
                <div style="
                  background:#ffffff;
                  border:1px solid #dbeafe;
                  color:#1e3a8a;
                  padding:8px 12px;
                  border-radius:999px;
                  font-size:13px;
                  font-weight:bold;
                ">
                  Semester Aktif: ${semester}
                </div>

                <div style="
                  background:#ffffff;
                  border:1px solid #dcfce7;
                  color:#166534;
                  padding:8px 12px;
                  border-radius:999px;
                  font-size:13px;
                  font-weight:bold;
                ">
                  Tahun Pelajaran: ${schoolYear}
                </div>
              </div>
            </div>

            <div style="padding: 28px;">
              ${contentHtml}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function initSidebarToggle() {
  const sidebar = document.getElementById("adminSidebar");
  const toggleBtn = document.getElementById("toggleSidebarBtn");
  const sidebarBrand = document.getElementById("sidebarBrand");

  if (!sidebar || !toggleBtn) return;

  const collapsed = localStorage.getItem("simSidebarCollapsed") === "true";

  function applySidebarState(isCollapsed) {
    const labels = document.querySelectorAll(".sidebar-label");
    const links = document.querySelectorAll(".sidebar-link");

    if (isCollapsed) {
      sidebar.style.width = "88px";
      if (sidebarBrand) sidebarBrand.style.display = "none";

      labels.forEach((label) => {
        label.style.display = "none";
      });

      links.forEach((link) => {
        link.style.justifyContent = "center";
      });
    } else {
      sidebar.style.width = "270px";
      if (sidebarBrand) sidebarBrand.style.display = "block";

      labels.forEach((label) => {
        label.style.display = "inline";
      });

      links.forEach((link) => {
        link.style.justifyContent = "flex-start";
      });
    }
  }

  applySidebarState(collapsed);

  toggleBtn.addEventListener("click", () => {
    const current = localStorage.getItem("simSidebarCollapsed") === "true";
    localStorage.setItem("simSidebarCollapsed", String(!current));
    applySidebarState(!current);
  });
}

function renderPlaceholderPage(title, description) {
  return getSidebarLayout(
    title,
    description,
    `
      <div style="
        background:#f8fafc;
        border:1px dashed #cbd5e1;
        border-radius:16px;
        padding:30px;
        text-align:center;
      ">
        <div style="font-size:42px; margin-bottom:12px;">🚧</div>
        <h3 style="margin:0 0 10px; color:#0f172a;">Menu ini sedang disiapkan</h3>
        <p style="margin:0; color:#64748b;">
          Struktur halaman sudah dibuat. Berikutnya kita bisa lanjut implementasi detail modul ini.
        </p>
      </div>
    `
  );
}

(async function initApp() {
  if (PAGE === "login") {
    document.querySelector("#app").innerHTML = `
      <div style="font-family: Arial; padding: 20px; background: #f5f6fa; min-height: 100vh;">
        <div style="max-width: 420px; margin: 40px auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="margin-bottom: 10px;">Login Admin</h2>
          <p style="color: gray; margin-bottom: 20px;">Masuk untuk mengakses dashboard dan import data.</p>

          <div style="margin-bottom: 14px;">
            <label><b>Username</b></label><br /><br />
            <input id="username" type="text" placeholder="Masukkan username" style="width:100%; padding:10px;" />
          </div>

          <div style="margin-bottom: 14px;">
            <label><b>Password</b></label><br /><br />
            <input id="password" type="password" placeholder="Masukkan password" style="width:100%; padding:10px;" />
          </div>

          <button id="loginBtn" style="width:100%; padding:12px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer;">
            Login
          </button>

          <div id="loginResult" style="margin-top:16px;"></div>

          <div style="margin-top:20px;">
            <a href="/?page=scanner" style="text-decoration:none;">Kembali ke Scanner</a>
          </div>
        </div>
      </div>
    `;

    initLoginPage();
  } else if (PAGE === "dashboard") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = getSidebarLayout(
        "Dashboard",
        "Monitoring kehadiran siswa secara realtime.",
        `
          <div style="
            margin-bottom: 20px;
            padding: 18px;
            background: #f8fafc;
            border-radius: 14px;
            border: 1px solid #e2e8f0;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            align-items: end;
          ">
            <div>
              <label for="filterDate"><b>Filter tanggal:</b></label><br />
              <input type="date" id="filterDate" style="padding:10px; margin-top:6px;" />
            </div>

            <div>
              <label for="filterClass"><b>Filter kelas:</b></label><br />
              <select id="filterClass" style="padding:10px; margin-top:6px;">
                <option value="">Semua Kelas</option>
              </select>
            </div>

            <div>
              <label for="filterStatus"><b>Filter status:</b></label><br />
              <select id="filterStatus" style="padding:10px; margin-top:6px;">
                <option value="">Semua Status</option>
                <option value="hadir">Hadir</option>
                <option value="terlambat">Terlambat</option>
                <option value="sangat terlambat">Sangat Terlambat</option>
              </select>
            </div>

            <div>
              <button id="filterBtn" style="padding:10px 14px;">Tampilkan</button>
              <button id="resetBtn" style="padding:10px 14px;">Reset</button>
            </div>
          </div>

          <div id="dashboardContent">Memuat data dashboard...</div>
        `
      );

      loadClassOptions();
      loadDashboard();
      initSidebarToggle();

      document.getElementById("filterBtn").addEventListener("click", () => {
        const selectedDate = document.getElementById("filterDate").value;
        const selectedClass = document.getElementById("filterClass").value;
        const selectedStatus = document.getElementById("filterStatus").value;

        loadDashboard({
          date: selectedDate,
          classId: selectedClass,
          status: selectedStatus
        });
      });

      document.getElementById("resetBtn").addEventListener("click", () => {
        document.getElementById("filterDate").value = "";
        document.getElementById("filterClass").value = "";
        document.getElementById("filterStatus").value = "";
        loadDashboard();
      });

      document.getElementById("logoutBtn")?.addEventListener("click", logout);
    }
  } else if (PAGE === "profile") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = getSidebarLayout(
        "Profil Madrasah",
        "Kelola identitas sekolah, kepala madrasah, semester aktif, dan informasi utama lainnya.",
        `
          <div id="profilePageContent"></div>
        `
      );

      initSidebarToggle();
      document.getElementById("logoutBtn")?.addEventListener("click", logout);

      const profileContainer = document.getElementById("profilePageContent");
      if (profileContainer) {
        profileContainer.innerHTML = `
          <div style="display:grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 18px 20px;">
            <div>
              <label style="display:block; margin-bottom:8px; font-weight:bold;">Nama Sekolah</label>
              <input id="school_name" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
            </div>

            <div>
              <label style="display:block; margin-bottom:8px; font-weight:bold;">Logo URL</label>
              <input id="school_logo_url" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
            </div>

            <div style="grid-column: 1 / -1;">
              <label style="display:block; margin-bottom:8px; font-weight:bold;">Alamat Sekolah</label>
              <textarea id="school_address" rows="3" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;"></textarea>
            </div>

            <div>
              <label style="display:block; margin-bottom:8px; font-weight:bold;">Nama Kepala Madrasah</label>
              <input id="principal_name" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
            </div>

            <div>
              <label style="display:block; margin-bottom:8px; font-weight:bold;">NIP Kepala Madrasah</label>
              <input id="principal_nip" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
            </div>

            <div>
              <label style="display:block; margin-bottom:8px; font-weight:bold;">Semester Aktif</label>
              <select id="current_semester" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <div>
              <label style="display:block; margin-bottom:8px; font-weight:bold;">Tahun Pelajaran Aktif</label>
              <select id="current_school_year" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;">
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
                <option value="2028/2029">2028/2029</option>
                <option value="2029/2030">2029/2030</option>
              </select>
            </div>
          </div>

          <div style="margin-top: 24px; display:flex; gap:12px; flex-wrap:wrap;">
            <button id="saveSettingsBtn" style="padding:12px 18px; background:#f59e0b; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">
              Simpan Profil Madrasah
            </button>
          </div>

          <div id="settingsResult" style="margin-top:16px;"></div>
        `;

        initSettingsPage();
      }
    }
  } else if (PAGE === "students") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = getSidebarLayout(
        "Data Siswa",
        "Kelola data siswa, tambah siswa baru, edit data, dan hapus data siswa.",
        `
        <div id="studentsPageContent"></div>
      `
      );

      initSidebarToggle();
      document.getElementById("logoutBtn")?.addEventListener("click", logout);
      initStudentsPage();
    }
  } else if (PAGE === "student-portal") {
    initStudentPortalPage();
  } else if (PAGE === "teachers") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = getSidebarLayout(
        "Data Guru",
        "Kelola data guru, pegawai, role wali kelas, BK, dan akun login guru.",
        `<div id="teachersPageContent"></div>`
      );

      initSidebarToggle();
      document.getElementById("logoutBtn")?.addEventListener("click", logout);
      initTeachersPage();
    }
  } else if (PAGE === "student-login") {
    document.querySelector("#app").innerHTML = `
    <div style="font-family: Arial; padding: 20px; background:#f5f7fb; min-height:100vh;">
      <div style="max-width:420px; margin:50px auto; background:white; padding:26px; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.08);">
        <h2 style="margin:0 0 8px;">Login Siswa</h2>
        <p style="color:#64748b; margin-bottom:20px;">Masuk menggunakan NISN dan password.</p>

        <div style="margin-bottom:14px;">
          <label><b>NISN</b></label><br /><br />
          <input id="studentUsername" type="text" placeholder="Masukkan NISN" style="width:100%; padding:12px;" />
        </div>

        <div style="margin-bottom:14px;">
          <label><b>Password</b></label><br /><br />
          <input id="studentPassword" type="password" placeholder="Masukkan password" style="width:100%; padding:12px;" />
        </div>

        <button id="studentLoginBtn" style="width:100%; padding:12px; background:#2563eb; color:white; border:none; border-radius:10px; cursor:pointer;">
          Login Siswa
        </button>

        <div id="studentLoginResult" style="margin-top:16px;"></div>

        <div style="margin-top:18px;">
          <a href="/?page=login">Login Admin</a>
        </div>
      </div>
    </div>
  `;

    initStudentLoginPage();
  } else if (PAGE === "report") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = getSidebarLayout(
        "Cetak Laporan Absensi",
        "Pilih filter kelas dan periode untuk membuat laporan rekap bulanan siap cetak.",
        `
          <div style="max-width: 850px;">
            <div style="display:grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 18px 20px;">
              <div>
                <label style="display:block; margin-bottom:8px; font-weight:bold;">Kelas</label>
                <select id="reportClass" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;"></select>
              </div>

              <div>
                <label style="display:block; margin-bottom:8px; font-weight:bold;">Bulan</label>
                <select id="reportMonth" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;">
                  <option value="1">Januari</option>
                  <option value="2">Februari</option>
                  <option value="3">Maret</option>
                  <option value="4">April</option>
                  <option value="5">Mei</option>
                  <option value="6">Juni</option>
                  <option value="7">Juli</option>
                  <option value="8">Agustus</option>
                  <option value="9">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>

              <div>
                <label style="display:block; margin-bottom:8px; font-weight:bold;">Tahun</label>
                <input id="reportYear" value="2026" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
              </div>

              <div>
                <label style="display:block; margin-bottom:8px; font-weight:bold;">Wali Kelas</label>
                <input id="reportWali" value="Dra. Hj. Hajidah, M.Si" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
              </div>

              <div>
                <label style="display:block; margin-bottom:8px; font-weight:bold;">Semester</label>
                <input id="reportSemester" value="${getCurrentAcademicInfo().semester}" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
              </div>

              <div>
                <label style="display:block; margin-bottom:8px; font-weight:bold;">Tahun Pelajaran</label>
                <input id="reportTahunPelajaran" value="${getCurrentAcademicInfo().schoolYear}" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
              </div>
            </div>

            <div style="margin-top: 24px; padding: 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; color:#4b5563;">
              Laporan akan dibuka di tab baru dalam format rekap bulanan per kelas.
            </div>

            <div style="margin-top: 24px; display:flex; gap:12px; flex-wrap:wrap;">
              <button id="cetakBtn" style="padding:12px 18px; background:#2563eb; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">
                Cetak Laporan
              </button>
            </div>
          </div>
        `
      );

      initReportPage();
      initSidebarToggle();
      document.getElementById("logoutBtn")?.addEventListener("click", logout);
    }
  } else if (PAGE === "classes") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = getSidebarLayout(
        "Data Kelas",
        "Kelola data kelas yang akan digunakan pada siswa dan laporan.",
        `<div id="classesPageContent"></div>`
      );

      initSidebarToggle();
      document.getElementById("logoutBtn")?.addEventListener("click", logout);
      initClassesPage();
    }
} else if (PAGE === "import-guru") {
  if (!requireAuth()) {
    //
  } else {
    await syncAcademicInfo();

    document.querySelector("#app").innerHTML = getSidebarLayout(
      "Import Data Guru",
      "Upload file Excel untuk memasukkan data guru ke MySQL.",
      `
        <div class="bg-white rounded-lg shadow p-6">
          <div class="mb-4">
            <a href="#" id="downloadGuruTemplateBtn" class="inline-block mb-3 text-sm text-blue-600 hover:underline">⬇️ Download Template Excel Guru</a>
            <label class="block text-sm font-medium mb-2">Pilih file Excel</label>
            <input type="file" id="excelGuruFile" accept=".xlsx,.xls" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <button id="uploadGuruBtn" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded">Upload Excel</button>
          <div id="importGuruResult" class="mt-4"></div>
          
          <div class="mt-6 p-4 bg-blue-50 rounded text-sm">
            <h4 class="font-bold mb-2">Panduan Format Excel:</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Kolom wajib: <b>teacher_id</b>, <b>teacher_name</b></li>
              <li>Salah satu harus ada: <b>nip</b> atau <b>email</b> (untuk username)</li>
              <li>Kolom opsional: phone, status_active, roles</li>
              <li>Roles dipisah koma (contoh: guru,wali_kelas)</li>
              <li>Password default untuk guru baru: <b>default12345</b></li>
            </ul>
          </div>
        </div>
      `
    );

    initImportGuruPage();
    initSidebarToggle();
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
  }
  } else if (PAGE === "import") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = getSidebarLayout(
        "Import Data Siswa",
        "Upload file Excel untuk memasukkan data siswa ke MySQL.",
        `
          <div style="max-width: 720px; background:white; padding:20px; border-radius:12px; border:1px solid #e5e7eb;">
            <div style="margin-bottom:16px;">
              <label for="excelFile"><b>Pilih file Excel</b></label><br /><br />
              <input type="file" id="excelFile" accept=".xlsx,.xls" />
            </div>

            <button id="uploadBtn" style="padding:10px 16px; background:#16a34a; color:white; border:none; border-radius:8px; cursor:pointer;">
              Upload Excel
            </button>

            <div id="importResult" style="margin-top:20px;"></div>
          </div>
        `
      );

      initImportPage();
      initSidebarToggle();
      document.getElementById("logoutBtn")?.addEventListener("click", logout);
    }

  } else if (PAGE === "settings") {
    if (!requireAuth()) return;

    document.querySelector("#app").innerHTML = getSidebarLayout(
      "Settings Admin",
      "Kelola konfigurasi sistem inti.",
      `
    <div style="background:white; padding:24px; border-radius:16px; border:1px solid #e5e7eb;">  <h3 style="margin-top:0; margin-bottom:20px; color:#1e293b; border-bottom:2px solid #f1f5f9; padding-bottom:10px;">
        <i class="fas fa-clock" style="margin-right:8px;"></i> Pengaturan Waktu Absensi
      </h3>
      
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:600; color:#475569;">Batas Jam Siswa Bisa Absen</label>
          <input id="attendance_open_time" type="time" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px; font-size:16px;">
        </div>
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:600; color:#475569;">Jam Masuk</label>
          <input id="school_start_time" type="time" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px; font-size:16px;">
        </div>
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:600; color:#475569;">Batas Terlambat</label>
          <input id="school_late_time" type="time" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px; font-size:16px;">
        </div>
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:600; color:#475569;">Jam Pulang</label>
          <input id="school_return_time" type="time" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px; font-size:16px;">
        </div>
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:600; color:#475569;">Batas Akhir Bisa Absen Pulang</label>
          <input id="attendance_close_return_time" type="time" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px; font-size:16px;">
        </div>
      </div>

      <button id="saveSettingsBtn" style="width:100%; padding:15px; background:#2563eb; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:bold; font-size:16px; transition: background 0.2s;">
        <i class="fas fa-save" style="margin-right:8px;"></i> Simpan Pengaturan Jam
      </button>
    </div>
    <!-- TAMBAHKAN BARIS INI -->
      <div id="settingsResult" style="margin-top:16px;"></div> 
    </div>
    `
    );


    initSidebarToggle();
    initSettingsPage(); // Inisialisasi logika pengisian data & tombol simpan

  } else if (PAGE === "facilities") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = renderPlaceholderPage(
        "Sarana Prasarana",
        "Modul sarana prasarana akan dibuat di sini."
      );

      initSidebarToggle();
      document.getElementById("logoutBtn")?.addEventListener("click", logout);
    }
  } else if (PAGE === "teacher-login") {
    document.querySelector("#app").innerHTML = `
    <div style="max-width:420px; margin:60px auto; background:white; padding:24px; border-radius:14px;">
      <h2>Login Guru</h2>

      <input id="teacherUsername" placeholder="NIP / Email" style="width:100%; padding:10px; margin-top:10px;" />
      <input id="teacherPassword" type="password" placeholder="Password" style="width:100%; padding:10px; margin-top:10px;" />

      <button id="teacherLoginBtn" style="width:100%; margin-top:14px; padding:10px; background:#2563eb; color:white;">
        Login
      </button>

      <div id="teacherLoginResult" style="margin-top:10px;"></div>
    </div>
  `;

    initTeacherLoginPage();
  } else if (PAGE === "teacher-portal") {
    initTeacherPortalPage();
  } else if (PAGE === "bk") {
    if (!requireAuth()) {
      //
    } else {
      await syncAcademicInfo();

      document.querySelector("#app").innerHTML = renderPlaceholderPage(
        "BK",
        "Modul bimbingan konseling akan dibuat di sini."
      );

      initSidebarToggle();
      document.getElementById("logoutBtn")?.addEventListener("click", logout);
    }
  } else {
    document.querySelector("#app").innerHTML = `
      <div style="font-family: Arial; padding: 20px; background: #f5f6fa; min-height: 100vh;">
        <div style="max-width: 900px; margin: auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
            <div>
              <h1>SIM Madrasah</h1>
              <p><b>Scanner ID:</b> ${SCANNER_ID}</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${isLoggedIn() ? `<a href="/?page=dashboard" style="text-decoration:none; padding:10px 14px; background:#7c3aed; color:white; border-radius:8px;">Admin Panel</a>` : ""}
              ${!isLoggedIn() ? `<a href="/?page=login" style="text-decoration:none; padding:10px 14px; background:#111827; color:white; border-radius:8px;">Login</a>` : ""}
            </div>
          </div>

          <div style="background:white; padding:20px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); margin-top:20px;">
            <div id="reader" style="width: 320px; margin: 20px auto;"></div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:20px;">
              <input id="studentInput" placeholder="Masukkan Student ID" style="padding:10px; min-width:260px;" />
              <button id="absenBtn" style="padding:10px 16px;">Absen</button>
            </div>

            <div id="result" style="margin-top:20px;"></div>
          </div>
        </div>
      </div>
    `;

    initScanner(SCANNER_ID);
  }
})();
