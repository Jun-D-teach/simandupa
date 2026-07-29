import { API_URL } from "./config";

export function initStudentPortalPage() {
  const studentData = JSON.parse(localStorage.getItem("simStudent") || "{}");

  if (!studentData || !studentData.student_id) {
    window.location.href = "/?page=student-login";
    return;
  }

  const app = document.querySelector("#app");

  app.innerHTML = `
  
    <div style="font-family: Arial; padding:20px; background:#f5f7fb; min-height:100vh;">
      <div style="max-width:800px; margin:0 auto; background:white; padding:24px; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.08);">
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h2 style="margin:0;">Portal Siswa</h2>
          <button id="studentLogoutBtn" style="padding:8px 12px; background:#dc2626; color:white; border:none; border-radius:8px; cursor:pointer;">
            Logout
          </button>
        </div>

        <div style="margin-bottom:20px;">
          <b>Nama:</b> ${studentData.student_name || "-"}<br />
          <b>NIS:</b> ${studentData.nis || "-"}<br />
          <b>NISN:</b> ${studentData.nisn || "-"}<br />
          <b>Kelas:</b> ${studentData.class_id || "-"}
        </div>

        <div style="margin-top:20px;">
          <h3>QR Code Siswa</h3>

          ${
            studentData.qr_code
              ? `
                <div style="text-align:center; margin-top:16px;">
                  <img src="${studentData.qr_code}" style="max-width:200px;" />
                </div>
              `
              : `
                <div style="color:#b91c1c; margin-top:10px;">
                  QR Code belum dibuat. Hubungi admin.
                </div>
              `
          }
        </div>

      </div>
      </div>
   <div style="margin-top:24px;">
  <h3>Riwayat Absensi</h3>

  <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px;">
    <select id="attendanceMonthFilter" style="padding:10px;">
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

    <input id="attendanceYearFilter" type="number" style="padding:10px; width:120px;" />

    <button id="attendanceFilterBtn" style="padding:10px 14px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer;">
      Tampilkan
    </button>
    <button id="attendanceExportBtn" style="padding:10px; background:#16a34a; color:white; border:none; border-radius:8px;">
  Export CSV
</button>
<button id="attendanceExportPdfBtn" style="padding:10px; background:#ef4444; color:white; border:none; border-radius:8px;">
  Export PDF
</button>
  </div>

  <div id="studentAttendanceBox">Memuat riwayat absensi...</div>
</div>
      <div style="margin-top:24px; padding:18px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:14px;">
  <h3 style="margin-top:0;">Ganti Password</h3>

  <div style="margin-bottom:12px;">
    <label><b>Password Lama</b></label><br /><br />
    <input id="oldStudentPassword" type="password" style="width:100%; padding:10px;" />
  </div>

  <div style="margin-bottom:12px;">
    <label><b>Password Baru</b></label><br /><br />
    <input id="newStudentPassword" type="password" style="width:100%; padding:10px;" />
  </div>

  <button id="changeStudentPasswordBtn" style="padding:10px 14px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer;">
    Simpan Password Baru
  </button>

  <div id="changePasswordResult" style="margin-top:12px;"></div>
</div>
    
  `;
  const now = new Date();
const activeMonth = now.getMonth() + 1;
const activeYear = now.getFullYear();

document.getElementById("attendanceMonthFilter").value = String(activeMonth);
document.getElementById("attendanceYearFilter").value = String(activeYear);

// load default bulan aktif
loadStudentAttendance(studentData.student_id, activeMonth, activeYear);

// tombol filter
document.getElementById("attendanceFilterBtn")?.addEventListener("click", () => {
  const month = document.getElementById("attendanceMonthFilter").value;
  const year = document.getElementById("attendanceYearFilter").value;

  loadStudentAttendance(studentData.student_id, month, year);
  });
document.getElementById("attendanceExportBtn")?.addEventListener("click", async () => {
  const month = document.getElementById("attendanceMonthFilter").value;
  const year = document.getElementById("attendanceYearFilter").value;

  await exportStudentAttendanceCsv(studentData, month, year);
});
document.getElementById("attendanceExportPdfBtn")?.addEventListener("click", async () => {
  const month = document.getElementById("attendanceMonthFilter").value;
  const year = document.getElementById("attendanceYearFilter").value;

  await exportStudentAttendancePdf(studentData, month, year);
});
loadStudentAttendance(studentData.student_id);
  document.getElementById("studentLogoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("simStudent");
    window.location.href = "/?page=student-login";
  });
  document.getElementById("changeStudentPasswordBtn")?.addEventListener("click", async () => {
  const oldPassword = document.getElementById("oldStudentPassword")?.value;
  const newPassword = document.getElementById("newStudentPassword")?.value;
  const resultBox = document.getElementById("changePasswordResult");

  try {
    const response = await fetch(`${API_URL}/api/student/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        student_id: studentData.student_id,
        old_password: oldPassword,
        new_password: newPassword
      })
    });

    const result = await response.json();

    resultBox.innerHTML = `
      <div style="color:${result.success ? "green" : "red"};">
        ${result.message}
      </div>
    `;

    if (result.success) {
      document.getElementById("oldStudentPassword").value = "";
      document.getElementById("newStudentPassword").value = "";
    }
  } catch (error) {
    resultBox.innerHTML = `<div style="color:red;">Gagal mengubah password.</div>`;
  }
});
}
async function exportStudentAttendanceCsv(studentData, month, year) {
  try {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);

    const response = await fetch(
      `${API_URL}/api/student/${studentData.student_id}/attendance?${params.toString()}`
    );

    const result = await response.json();

    if (!result.success) {
      alert("Gagal mengambil data absensi.");
      return;
    }

    const rows = result.data || [];

    const header = [
      "Nama",
      "NIS",
      "NISN",
      "Kelas",
      "Tanggal",
      "Jam",
      "Status",
      "Scanner"
    ];

    const csvRows = [
      header.join(","),
      ...rows.map((item) => {
        const tanggal = new Date(item.attendance_date).toLocaleDateString("id-ID");

        return [
          studentData.student_name || "",
          studentData.nis || "",
          studentData.nisn || "",
          studentData.class_id || "",
          tanggal,
          item.attendance_time || "",
          item.status || "",
          item.scanner_id || ""
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",");
      })
    ];

    if (rows.length === 0) {
      csvRows.push([
        studentData.student_name || "",
        studentData.nis || "",
        studentData.nisn || "",
        studentData.class_id || "",
        "Tidak ada data",
        "",
        "",
        ""
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
    }

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `absensi-${studentData.student_id}-${month}-${year}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("EXPORT ABSENSI ERROR:", error);
    alert("Gagal export absensi.");
  }
}

function renderAttendanceSummary(data) {
  let hadir = 0;
  let terlambat = 0;
  let sangatTerlambat = 0;

  data.forEach((item) => {
    const status = (item.status || "").toLowerCase();

    if (status === "hadir") hadir++;
    else if (status === "terlambat") terlambat++;
    else if (status === "sangat terlambat") sangatTerlambat++;
  });

  return `
    <div style="display:flex; gap:10px; margin-bottom:12px;">
      <div style="flex:1; background:#dcfce7; padding:12px; border-radius:10px;">
        <b>Hadir</b><br>${hadir}
      </div>

      <div style="flex:1; background:#fef9c3; padding:12px; border-radius:10px;">
        <b>Terlambat</b><br>${terlambat}
      </div>

      <div style="flex:1; background:#fee2e2; padding:12px; border-radius:10px;">
        <b>Sangat Terlambat</b><br>${sangatTerlambat}
      </div>
    </div>
  `;
}
async function exportStudentAttendancePdf(studentData, month, year) {
  try {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);

    const response = await fetch(
      `${API_URL}/api/student/${studentData.student_id}/attendance?${params}`
    );

    const result = await response.json();
    if (!result.success) {
      alert("Gagal ambil data");
      return;
    }

    const rows = result.data || [];

    // 🔥 buat HTML PDF
    const html = `
      <html>
      <head>
        <title>Absensi Siswa</title>
        <style>
          body { font-family: Arial; padding:20px; }
          h2 { margin-bottom:5px; }
          table { width:100%; border-collapse:collapse; margin-top:20px; }
          th, td { border:1px solid #000; padding:8px; text-align:left; }
          th { background:#eee; }
        </style>
      </head>
      <body>

        <h2>Riwayat Absensi Siswa</h2>
        <p>
          Nama: ${studentData.student_name}<br>
          NIS: ${studentData.nis}<br>
          NISN: ${studentData.nisn}<br>
          Kelas: ${studentData.class_id}<br>
          Bulan: ${month} / ${year}
        </p>

        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jam</th>
              <th>Status</th>
              <th>Scanner</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length
                ? rows.map(item => `
                  <tr>
                    <td>${new Date(item.attendance_date).toLocaleDateString("id-ID")}</td>
                    <td>${item.attendance_time || "-"}</td>
                    <td>${item.status || "-"}</td>
                    <td>${item.scanner_id || "-"}</td>
                  </tr>
                `).join("")
                : `<tr><td colspan="4">Tidak ada data</td></tr>`
            }
          </tbody>
        </table>

      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();

    win.focus();
    win.print();

  } catch (error) {
    console.error("PDF ERROR:", error);
    alert("Gagal export PDF");
  }
}

async function loadStudentAttendance(studentId, month, year) {
  const box = document.getElementById("studentAttendanceBox");
  if (!box) return;

  try {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);

    const response = await fetch(`${API_URL}/api/student/${studentId}/attendance?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      box.innerHTML = `<div>Gagal memuat data.</div>`;
      return;
    }

    const summaryHtml = renderAttendanceSummary(result.data || []);

    if (!result.data || !result.data.length) {
      box.innerHTML = summaryHtml + `<div>Belum ada absensi bulan ini.</div>`;
      return;
    }

    box.innerHTML = `
      ${summaryHtml}

      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#0f172a; color:white;">
            <th style="padding:10px;">Tanggal</th>
            <th>Jam</th>
            <th>Status</th>
            <th>Scanner</th>
          </tr>
        </thead>
        <tbody>
          ${result.data.map(item => `
            <tr>
              <td style="padding:10px; border-bottom:1px solid #ddd;">
                ${new Date(item.attendance_date).toLocaleDateString("id-ID")}
              </td>
              <td>${item.attendance_time || "-"}</td>
              <td>${item.status || "-"}</td>
              <td>${item.scanner_id || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("LOAD ABSENSI ERROR:", err);
    box.innerHTML = `<div style="color:red;">Gagal load absensi</div>`;
  }
}

