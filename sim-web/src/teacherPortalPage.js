const API_URL = "http://localhost:3000";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function getLoggedTeacher() {
  try {
    return JSON.parse(localStorage.getItem("simTeacher") || "null");
  } catch {
    return null;
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gagal memproses data");
  }

  return result;
}

function getPermitTypeLabel(type) {
  const labels = {
    izin_keluar: "Izin Keluar",
    izin_pulang: "Izin Pulang",
    izin_sakit: "Izin Sakit",
    lainnya: "Lainnya",
  };

  return labels[type] || type || "-";
}

function formatDateDisplay(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).split("T")[0];
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatTimeDisplay(value) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

function renderTeacherPortal(teacher) {
  const isWaliKelas = (teacher.roles || []).includes("wali_kelas");

  document.querySelector("#app").innerHTML = `
    <div class="teacher-page">
      <div class="teacher-wrap">

        <div class="teacher-hero">
          <div class="teacher-hero-left">
            <div class="teacher-avatar">👨‍🏫</div>
            <div>
              <h1>Portal Guru</h1>
              <p>Kelola profil, buat form ijin siswa, monitoring absensi, dan pantau history ijin.</p>
            </div>
          </div>

          <button id="teacherLogoutBtn" class="logout-modern">Logout</button>
        </div>

        <div class="modern-card">
          <div class="modern-card-body">
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
              <button class="teacherTabBtn btn-primary-modern" data-tab="profile">Profil</button>

              ${
                isWaliKelas
                  ? `<button class="teacherTabBtn btn-secondary-modern" data-tab="attendance">Monitoring Absensi</button>`
                  : ""
              }

              <button class="teacherTabBtn btn-secondary-modern" data-tab="permitForm">Form Ijin Siswa</button>
              <button class="teacherTabBtn btn-secondary-modern" data-tab="permitHistory">History Ijin</button>
            </div>

            <div id="teacherTabContent"></div>
          </div>
        </div>

      </div>
    </div>
  `;
}
function setActiveTeacherTab(activeTab) {
  document.querySelectorAll(".teacherTabBtn").forEach((btn) => {
    btn.classList.remove("btn-primary-modern");
    btn.classList.remove("btn-secondary-modern");

    if (btn.dataset.tab === activeTab) {
      btn.classList.add("btn-primary-modern");
    } else {
      btn.classList.add("btn-secondary-modern");
    }
  });
}

function renderProfileTab(teacher) {
  const box = document.getElementById("teacherTabContent");

  box.innerHTML = `
    <h2 class="card-title">Profil Guru</h2>
    <p class="card-subtitle">Informasi akun guru yang sedang login.</p>

    <div class="form-grid-modern">
      <div>
        <label class="modern-label">ID Guru</label>
        <input class="modern-input" value="${escapeHtml(teacher.teacher_id || "-")}" readonly />
      </div>

      <div>
        <label class="modern-label">Nama Guru</label>
        <input class="modern-input" value="${escapeHtml(teacher.teacher_name || "-")}" readonly />
      </div>

      <div>
        <label class="modern-label">NIP</label>
        <input class="modern-input" value="${escapeHtml(teacher.nip || "-")}" readonly />
      </div>

      <div>
        <label class="modern-label">Email</label>
        <input class="modern-input" value="${escapeHtml(teacher.email || "-")}" readonly />
      </div>

      <div>
        <label class="modern-label">No. HP</label>
        <input class="modern-input" value="${escapeHtml(teacher.phone || "-")}" readonly />
      </div>

      <div>
        <label class="modern-label">Role</label>
        <input class="modern-input" value="${escapeHtml((teacher.roles || []).join(", ") || "-")}" readonly />
      </div>
    </div>
  `;
}

function renderPermitFormTab(teacher) {
  const box = document.getElementById("teacherTabContent");

  box.innerHTML = `
    <h2 class="card-title">Form Ijin Siswa</h2>
    <p class="card-subtitle">
      Cari nama siswa, lalu data NISN, kelas, dan wali kelas akan tampil otomatis.
    </p>

    <div class="form-grid-modern">
      <div>
        <label class="modern-label">ID Guru Pembuat Form</label>
        <input id="permitTeacherId" class="modern-input" value="${escapeHtml(teacher.teacher_id)}" readonly />
      </div>

      <div>
        <label class="modern-label">Nama Guru</label>
        <input id="permitTeacherName" class="modern-input" value="${escapeHtml(teacher.teacher_name)}" readonly />
      </div>

      <div class="field-full" style="position:relative;">
        <label class="modern-label">Cari Nama Siswa</label>
        <input id="studentSearchInput" class="modern-input" placeholder="Ketik minimal 2 huruf nama/NISN/NIS siswa..." autocomplete="off" />
        <input id="selectedStudentId" type="hidden" />
        <div id="studentSearchResult" class="student-dropdown"></div>
      </div>

      <div>
        <label class="modern-label">NIS</label>
        <input id="studentNis" class="modern-input" readonly />
      </div>

      <div>
        <label class="modern-label">NISN</label>
        <input id="studentNisn" class="modern-input" readonly />
      </div>

      <div>
        <label class="modern-label">Kelas</label>
        <input id="studentClass" class="modern-input" readonly />
      </div>

      <div>
        <label class="modern-label">Wali Kelas</label>
        <input id="studentHomeroomTeacher" class="modern-input" readonly />
      </div>

      <div>
        <label class="modern-label">Jenis Ijin</label>
        <select id="permitType" class="modern-select">
          <option value="izin_keluar">Izin Keluar</option>
          <option value="izin_pulang">Izin Pulang</option>
          <option value="izin_sakit">Izin Sakit</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <div>
        <label class="modern-label">Tanggal Ijin</label>
        <input id="permitDate" type="date" class="modern-input" value="${getTodayDate()}" />
      </div>

      <div>
        <label class="modern-label">Jam Ijin</label>
        <input id="permitTime" type="time" class="modern-input" value="${getCurrentTime()}" />
      </div>

      <div class="field-full">
        <label class="modern-label">Alasan Ijin</label>
        <textarea id="permitReason" rows="4" class="modern-textarea" placeholder="Tuliskan alasan ijin siswa..."></textarea>
      </div>
    </div>

    <div style="margin-top:18px; display:flex; gap:10px; flex-wrap:wrap;">
      <button id="savePermitBtn" class="btn-primary-modern">Simpan Form Ijin</button>
      <button id="resetPermitBtn" class="btn-secondary-modern">Reset</button>
    </div>

    <div id="permitResult" style="margin-top:16px;"></div>
  `;

  initPermitEvents(teacher);
}

function renderPermitHistoryTab(teacher) {
  const box = document.getElementById("teacherTabContent");

  box.innerHTML = `
    <h2 class="card-title">History Ijin Siswa</h2>
    <p class="card-subtitle">
      Riwayat form ijin siswa yang pernah dibuat oleh guru ini.
    </p>

    <div class="history-filter">
      <div>
        <label class="modern-label">Dari Tanggal</label>
        <input id="historyDateFrom" type="date" class="modern-input" />
      </div>

      <div>
        <label class="modern-label">Sampai Tanggal</label>
        <input id="historyDateTo" type="date" class="modern-input" />
      </div>

      <div>
        <label class="modern-label">Jenis Ijin</label>
        <select id="historyPermitType" class="modern-select">
          <option value="">Semua</option>
          <option value="izin_keluar">Izin Keluar</option>
          <option value="izin_pulang">Izin Pulang</option>
          <option value="izin_sakit">Izin Sakit</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <div>
        <label class="modern-label">Status</label>
        <select id="historyStatus" class="modern-select">
          <option value="">Semua</option>
          <option value="dibuat">Dibuat</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
      </div>

      <div>
        <label class="modern-label">Cari Siswa</label>
        <input id="historyKeyword" class="modern-input" placeholder="Nama/NISN/Kelas" />
      </div>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin:14px 0;">
      <button id="filterHistoryBtn" class="btn-primary-modern">Tampilkan History</button>
      <button id="resetHistoryBtn" class="btn-secondary-modern">Reset Filter</button>
    </div>

    <div id="permitHistorySummary" style="margin-bottom:12px;"></div>
    <div id="permitHistoryContent">Memuat history ijin...</div>
  `;

  initPermitHistoryEvents(teacher);
  loadPermitHistory(teacher);
}

function renderAttendanceTab(teacher) {
  const box = document.getElementById("teacherTabContent");

  box.innerHTML = `
    <h2 class="card-title">Monitoring Absensi Wali Kelas</h2>
    <p class="card-subtitle">
      Pantau kehadiran siswa pada kelas yang menjadi tanggung jawab wali kelas.
    </p>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px;">
      <input id="wkAttendanceDate" type="date" class="modern-input" value="${getTodayDate()}" style="max-width:220px;" />
     <button id="wkLoadAttendanceBtn" class="btn-primary-modern">Tampilkan Absensi</button>

<button id="wkPrintTimeReportBtn" class="btn-secondary-modern">
  Cetak Laporan Jam Datang/Pulang
</button>
 </div>

    <div id="wkAttendanceResult">Memuat absensi...</div>
  `;

  initHomeroomAttendanceEvents(teacher);
}

function initTeacherTabs(teacher) {
  document.querySelectorAll(".teacherTabBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      setActiveTeacherTab(tab);

      if (tab === "profile") renderProfileTab(teacher);
      if (tab === "attendance") renderAttendanceTab(teacher);
      if (tab === "permitForm") renderPermitFormTab(teacher);
      if (tab === "permitHistory") renderPermitHistoryTab(teacher);
    });
  });

  setActiveTeacherTab("profile");
  renderProfileTab(teacher);
}
function fillStudentData(student) {
  document.getElementById("selectedStudentId").value = student.student_id || "";
  document.getElementById("studentSearchInput").value =
    student.student_name || "";
  document.getElementById("studentNis").value = student.nis || "-";
  document.getElementById("studentNisn").value = student.nisn || "-";
  document.getElementById("studentClass").value = student.class_id || "-";
  document.getElementById("studentHomeroomTeacher").value =
    student.wali_kelas_name || "-";

  const resultBox = document.getElementById("studentSearchResult");
  resultBox.style.display = "none";
  resultBox.innerHTML = "";
}

function renderStudentSearchResults(students) {
  const resultBox = document.getElementById("studentSearchResult");

  if (!students.length) {
    resultBox.style.display = "block";
    resultBox.innerHTML = `
      <div style="padding:12px; color:#64748b;">
        Siswa tidak ditemukan.
      </div>
    `;
    return;
  }

  resultBox.style.display = "block";
  resultBox.innerHTML = students
    .map(
      (student, index) => `
        <button type="button" data-index="${index}" class="student-option-modern student-option">
          <div style="font-weight:bold; color:#0f172a;">${escapeHtml(student.student_name)}</div>
          <div style="font-size:12px; color:#64748b;">
            NISN: ${escapeHtml(student.nisn || "-")} | Kelas: ${escapeHtml(student.class_id || "-")} | Wali Kelas: ${escapeHtml(student.wali_kelas_name || "-")}
          </div>
        </button>
      `,
    )
    .join("");

  document.querySelectorAll(".student-option").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      fillStudentData(students[index]);
    });
  });
}

function renderPermitHistory(result) {
  const summaryBox = document.getElementById("permitHistorySummary");
  const contentBox = document.getElementById("permitHistoryContent");

  const summary = result.summary || {};
  const data = result.data || [];

  summaryBox.innerHTML = `
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <div style="background:#eff6ff; color:#1d4ed8; padding:8px 12px; border-radius:999px; font-weight:bold; font-size:13px;">
        Total: ${summary.total || 0}
      </div>

      <div style="background:#dcfce7; color:#166534; padding:8px 12px; border-radius:999px; font-weight:bold; font-size:13px;">
        Dibuat: ${summary.dibuat || 0}
      </div>

      <div style="background:#fee2e2; color:#991b1b; padding:8px 12px; border-radius:999px; font-weight:bold; font-size:13px;">
        Dibatalkan: ${summary.dibatalkan || 0}
      </div>
    </div>
  `;

  if (!data.length) {
    contentBox.innerHTML = `
      <div class="empty-state">
        Belum ada data ijin sesuai filter.
      </div>
    `;
    return;
  }

  contentBox.innerHTML = `
    <div class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal/Jam</th>
            <th>Nama Siswa</th>
            <th>NISN</th>
            <th>Kelas</th>
            <th>Wali Kelas</th>
            <th>Jenis</th>
            <th>Alasan</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          ${data
            .map(
              (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <div style="font-weight:bold;">${escapeHtml(formatDateDisplay(item.permit_date))}</div>
                  <div style="font-size:12px; color:#64748b;">${escapeHtml(formatTimeDisplay(item.permit_time))}</div>
                </td>
                <td><b>${escapeHtml(item.student_name || "-")}</b></td>
                <td>${escapeHtml(item.nisn || "-")}</td>
                <td>${escapeHtml(item.class_id || "-")}</td>
                <td>${escapeHtml(item.wali_kelas_name || "-")}</td>
                <td>${escapeHtml(getPermitTypeLabel(item.permit_type))}</td>
                <td style="max-width:240px;">${escapeHtml(item.reason || "-")}</td>
                <td>
                  <span class="status-badge ${item.status === "dibatalkan" ? "status-danger" : "status-success"}">
                    ${escapeHtml(String(item.status || "-").toUpperCase())}
                  </span>
                </td>
              </tr>
            `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function loadHomeroomAttendance(teacher) {
  const date =
    document.getElementById("wkAttendanceDate")?.value || getTodayDate();
  const resultBox = document.getElementById("wkAttendanceResult");

  if (!resultBox) return;

  resultBox.innerHTML = "Memuat absensi...";

  try {
    const result = await fetchJson(
      `${API_URL}/api/teacher/${teacher.teacher_id}/homeroom/attendance?date=${date}`,
    );

    const summary = result.summary || {};
    const rows = result.data || [];
    window._lastHomeroomAttendance = {
      date,
      classes: result.classes || [],
      rows,
    };
    resultBox.innerHTML = `
      <div class="history-filter" style="margin-bottom:16px;">
        <div class="modern-card-body" style="background:#e0f2fe; border-radius:16px;">
          <b>Total Siswa</b><br>${summary.total_students || 0}
        </div>

        <div class="modern-card-body" style="background:#dcfce7; border-radius:16px;">
          <b>Sudah Absen</b><br>${summary.checked_in || 0}
        </div>

        <div class="modern-card-body" style="background:#e5e7eb; border-radius:16px;">
          <b>Belum Absen</b><br>${summary.not_checked_in || 0}
        </div>

        <div class="modern-card-body" style="background:#dcfce7; border-radius:16px;">
          <b>Hadir</b><br>${summary.hadir || 0}
        </div>

        <div class="modern-card-body" style="background:#fef9c3; border-radius:16px;">
          <b>Terlambat</b><br>${summary.terlambat || 0}
        </div>

        <div class="modern-card-body" style="background:#fee2e2; border-radius:16px;">
          <b>Sangat Terlambat</b><br>${summary.sangat_terlambat || 0}
        </div>
      </div>

      <div class="history-table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kelas</th>
              <th>NIS</th>
              <th>NISN</th>
              <th>Jam</th>
              <th>Status</th>
              <th>Scanner</th>
              <th>Orang Tua</th>
              <th>HP</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows.length
                ? rows
                    .map(
                      (r) => `
                        <tr>
                          <td><b>${escapeHtml(r.student_name || "-")}</b></td>
                          <td>${escapeHtml(r.class_id || "-")}</td>
                          <td>${escapeHtml(r.nis || "-")}</td>
                          <td>${escapeHtml(r.nisn || "-")}</td>
                          <td>${escapeHtml(r.attendance_time || "-")}</td>
                          <td>
                            <span class="status-badge ${
                              r.status === "hadir"
                                ? "status-success"
                                : r.status === "sangat terlambat"
                                  ? "status-danger"
                                  : ""
                            }">
                              ${escapeHtml(r.status || "-")}
                            </span>
                          </td>
                          <td>${escapeHtml(r.scanner_id || "-")}</td>
                          <td>${escapeHtml(r.parent_name || "-")}</td>
                          <td>${escapeHtml(r.parent_phone || "-")}</td>
                        </tr>
                      `,
                    )
                    .join("")
                : `<tr><td colspan="9">Tidak ada data siswa.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    resultBox.innerHTML = `
      <div class="alert-danger">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

function initHomeroomAttendanceEvents(teacher) {
  const loadBtn = document.getElementById("wkLoadAttendanceBtn");
  const printBtn = document.getElementById("wkPrintTimeReportBtn");

  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      loadHomeroomAttendance(teacher);
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      const data = window._lastHomeroomAttendance;

      if (!data || !data.classes || !data.classes.length) {
        alert("Data kelas belum tersedia. Klik Tampilkan Absensi dulu.");
        return;
      }

      const selectedDate =
        document.getElementById("wkAttendanceDate")?.value || getTodayDate();
      const dateObj = new Date(selectedDate);

      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();

      const classId = data.classes[0].class_id;
      const semester = localStorage.getItem("simCurrentSemester") || "Ganjil";
      const tahunPelajaran =
        localStorage.getItem("simCurrentSchoolYear") || "2025/2026";

      const url =
        `${API_URL}/api/export/homeroom-time-report` +
        `?teacherId=${encodeURIComponent(teacher.teacher_id)}` +
        `&classId=${encodeURIComponent(classId)}` +
        `&month=${month}` +
        `&year=${year}` +
        `&waliKelas=${encodeURIComponent(teacher.teacher_name || "")}` +
        `&nipWaliKelas=${encodeURIComponent(teacher.nip || "")}` +
        `&semester=${encodeURIComponent(semester)}` +
        `&tahunPelajaran=${encodeURIComponent(tahunPelajaran)}`;

      window.open(url, "_blank");
    });
  }

  loadHomeroomAttendance(teacher);
}

async function loadPermitHistory(teacher) {
  const dateFrom = document.getElementById("historyDateFrom")?.value || "";
  const dateTo = document.getElementById("historyDateTo")?.value || "";
  const permitType = document.getElementById("historyPermitType")?.value || "";
  const status = document.getElementById("historyStatus")?.value || "";
  const keyword = document.getElementById("historyKeyword")?.value.trim() || "";

  const params = new URLSearchParams();

  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (permitType) params.set("permitType", permitType);
  if (status) params.set("status", status);
  if (keyword) params.set("keyword", keyword);

  const contentBox = document.getElementById("permitHistoryContent");
  if (contentBox) {
    contentBox.innerHTML = "Memuat history ijin...";
  }

  try {
    const result = await fetchJson(
      `${API_URL}/api/teacher/${teacher.teacher_id}/student-permits?${params.toString()}`,
    );

    renderPermitHistory(result);
  } catch (error) {
    if (contentBox) {
      contentBox.innerHTML = `
        <div class="alert-danger">
          ${escapeHtml(error.message)}
        </div>
      `;
    }
  }
}

function initPermitHistoryEvents(teacher) {
  const filterBtn = document.getElementById("filterHistoryBtn");
  const resetBtn = document.getElementById("resetHistoryBtn");
  const keywordInput = document.getElementById("historyKeyword");

  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      loadPermitHistory(teacher);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.getElementById("historyDateFrom").value = "";
      document.getElementById("historyDateTo").value = "";
      document.getElementById("historyPermitType").value = "";
      document.getElementById("historyStatus").value = "";
      document.getElementById("historyKeyword").value = "";
      loadPermitHistory(teacher);
    });
  }

  if (keywordInput) {
    keywordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        loadPermitHistory(teacher);
      }
    });
  }
}

function resetPermitForm(teacher) {
  document.getElementById("selectedStudentId").value = "";
  document.getElementById("studentSearchInput").value = "";
  document.getElementById("studentNis").value = "";
  document.getElementById("studentNisn").value = "";
  document.getElementById("studentClass").value = "";
  document.getElementById("studentHomeroomTeacher").value = "";
  document.getElementById("permitType").value = "izin_keluar";
  document.getElementById("permitDate").value = getTodayDate();
  document.getElementById("permitTime").value = getCurrentTime();
  document.getElementById("permitReason").value = "";
  document.getElementById("permitTeacherId").value = teacher.teacher_id || "";
  document.getElementById("permitTeacherName").value =
    teacher.teacher_name || "";
}

async function loadTeacherProfile(teacher) {
  const result = await fetchJson(
    `${API_URL}/api/teacher/${teacher.teacher_id}/profile`,
  );
  const data = result.data;

  document.getElementById("profileTeacherName").textContent =
    data.teacher_name || "-";
  document.getElementById("profileTeacherNip").textContent = data.nip || "-";
  document.getElementById("profileTeacherEmail").textContent =
    data.email || "-";
  document.getElementById("profileTeacherPhone").textContent =
    data.phone || "-";
  document.getElementById("profileTeacherRoles").textContent =
    (data.roles || []).join(", ") || "-";

  const homeroomText = (data.homeroom_classes || [])
    .map((item) => item.class_id)
    .join(", ");

  document.getElementById("profileHomeroomClasses").textContent =
    homeroomText || "Bukan wali kelas";
}

function initPermitEvents(teacher) {
  const searchInput = document.getElementById("studentSearchInput");
  const saveBtn = document.getElementById("savePermitBtn");
  const resetBtn = document.getElementById("resetPermitBtn");
  const permitResult = document.getElementById("permitResult");

  let searchTimer = null;

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);

    const keyword = searchInput.value.trim();

    if (keyword.length < 2) {
      const resultBox = document.getElementById("studentSearchResult");
      resultBox.style.display = "none";
      resultBox.innerHTML = "";
      return;
    }

    searchTimer = setTimeout(async () => {
      try {
        const result = await fetchJson(
          `${API_URL}/api/teacher/${teacher.teacher_id}/students/search?keyword=${encodeURIComponent(keyword)}`,
        );

        renderStudentSearchResults(result.data || []);
      } catch (error) {
        document.getElementById("studentSearchResult").style.display = "block";
        document.getElementById("studentSearchResult").innerHTML = `
          <div class="alert-danger">
            ${escapeHtml(error.message)}
          </div>
        `;
      }
    }, 300);
  });

  resetBtn.addEventListener("click", () => {
    resetPermitForm(teacher);
    permitResult.innerHTML = "";
  });

  saveBtn.addEventListener("click", async () => {
    const studentId = document.getElementById("selectedStudentId").value.trim();

    if (!studentId) {
      permitResult.innerHTML = `
        <div class="alert-danger">
          Pilih siswa terlebih dahulu dari hasil pencarian.
        </div>
      `;
      return;
    }

    const payload = {
      teacher_id: teacher.teacher_id,
      student_id: studentId,
      permit_type: document.getElementById("permitType").value,
      permit_date: document.getElementById("permitDate").value,
      permit_time: document.getElementById("permitTime").value,
      reason: document.getElementById("permitReason").value.trim(),
    };

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Menyimpan...";

      const result = await fetchJson(`${API_URL}/api/student-permits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      permitResult.innerHTML = `
        <div class="alert-success">
          ${escapeHtml(result.message)}
        </div>
      `;

      resetPermitForm(teacher);
      loadPermitHistory(teacher);
    } catch (error) {
      permitResult.innerHTML = `
        <div class="alert-danger">
          ${escapeHtml(error.message)}
        </div>
      `;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan Form Ijin";
    }
  });

  document.getElementById("teacherLogoutBtn").addEventListener("click", () => {
    localStorage.removeItem("simTeacher");
    window.location.href = "/?page=teacher-login";
  });
}

async function initTeacherPortalPage() {
  const teacher = getLoggedTeacher();

  if (!teacher || !teacher.teacher_id) {
    window.location.href = "/?page=teacher-login";
    return;
  }

  renderTeacherPortal(teacher);
  initTeacherTabs(teacher);
  try {
    await loadTeacherProfile(teacher);
  } catch (error) {
    document.getElementById("profileHomeroomClasses").textContent =
      "Gagal memuat profil";
    console.error("LOAD TEACHER PROFILE ERROR:", error);
  }
}

export { initTeacherPortalPage };
