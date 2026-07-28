const API_URL = "http://localhost:3000";

async function initReportPage() {
  const classSelect = document.getElementById("reportClass");
  const monthSelect = document.getElementById("reportMonth");
  const yearInput = document.getElementById("reportYear");
  const waliInput = document.getElementById("reportWali");
  const semesterInput = document.getElementById("reportSemester");
  const tahunPelajaranInput = document.getElementById("reportTahunPelajaran");
  const cetakBtn = document.getElementById("cetakBtn");

  if (!classSelect || !monthSelect || !yearInput || !cetakBtn) return;

  const now = new Date();
  monthSelect.value = String(now.getMonth() + 1);
  yearInput.value = String(now.getFullYear());

  try {
    const res = await fetch(`${API_URL}/api/classes`, {
      headers: {
        "x-admin-key": localStorage.getItem("simAdminKey") || ""
      }
    });

    const result = await res.json();

    if (result.success) {
      result.data.forEach((cls) => {
        const opt = document.createElement("option");
        opt.value = cls.class_id;
        opt.textContent = cls.class_name;
        classSelect.appendChild(opt);
      });
    }
  } catch (error) {
    console.error("Load class report error:", error);
  }

  cetakBtn.addEventListener("click", () => {
    const classId = classSelect.value;
    const month = monthSelect.value;
    const year = yearInput.value.trim();
    const wali = encodeURIComponent(waliInput.value.trim());
    const semester = encodeURIComponent(semesterInput.value.trim());
    const tahunPelajaran = encodeURIComponent(tahunPelajaranInput.value.trim());

    if (!classId || !month || !year) {
      alert("Lengkapi filter dulu");
      return;
    }

    const url =
      `${API_URL}/api/export/report` +
      `?classId=${classId}` +
      `&month=${month}` +
      `&year=${year}` +
      `&waliKelas=${wali}` +
      `&semester=${semester}` +
      `&tahunPelajaran=${tahunPelajaran}`;

    window.open(url, "_blank");
  });
}

export { initReportPage };