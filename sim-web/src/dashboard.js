const API_URL = "http://localhost:3000";

function getAdminHeaders() {
  const adminKey = localStorage.getItem("simAdminKey") || "";
  return {
    "x-admin-key": adminKey
  };
}

async function loadDashboard(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.date) params.append("date", filters.date);
    if (filters.classId) params.append("classId", filters.classId);
    if (filters.status) params.append("status", filters.status);

    const response = await fetch(`${API_URL}/api/dashboard?${params.toString()}`, {
      headers: getAdminHeaders()
    });

    const result = await response.json();

    if (!result.success) {
      document.getElementById("dashboardContent").innerHTML =
        `<p style="color:red;">${result.message || "Gagal load data"}</p>`;
      return;
    }

    const { data, summary } = result;

    let html = `
      <h3>Summary</h3>
      <p>Total: ${summary.total}</p>
      <p>Hadir: ${summary.hadir}</p>
      <p>Terlambat: ${summary.terlambat}</p>
      <p>Sangat Terlambat: ${summary.sangat_terlambat}</p>

      <h3>Data Absensi</h3>
      <table border="1" cellpadding="5">
        <tr>
          <th>Nama</th>
          <th>Kelas</th>
          <th>Tanggal</th>
          <th>Jam</th>
          <th>Status</th>
          <th>Scanner</th>
        </tr>
    `;

    data.forEach((item) => {
      html += `
        <tr>
          <td>${item.student_name}</td>
          <td>${item.class_id}</td>
          <td>${item.attendance_date}</td>
          <td>${item.attendance_time}</td>
          <td>${item.status}</td>
          <td>${item.scanner_id}</td>
        </tr>
      `;
    });

    html += `</table>`;

    document.getElementById("dashboardContent").innerHTML = html;
  } catch (error) {
    console.error(error);
    document.getElementById("dashboardContent").innerHTML =
      `<p style="color:red;">Error load dashboard</p>`;
  }
}

async function loadClassOptions() {
  try {
    const response = await fetch(`${API_URL}/api/classes`, {
      headers: getAdminHeaders()
    });

    const result = await response.json();

    if (!result.success) return;

    const select = document.getElementById("filterClass");

    result.data.forEach((cls) => {
      const option = document.createElement("option");
      option.value = cls.class_id;
      option.textContent = cls.class_name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Load class error:", error);
  }
}

export { loadDashboard, loadClassOptions };