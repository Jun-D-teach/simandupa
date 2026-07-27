import { Html5QrcodeScanner } from "html5-qrcode";

const API_URL = "http://localhost:3000";

async function saveAttendance(studentId, scannerId) {
  try {
    if (!studentId) {
      document.getElementById("result").innerHTML = `<p style="color:red;">Student ID kosong.</p>`;
      return;
    }

    // Status ditentukan di backend berdasarkan settings (single source of truth).
    const response = await fetch(`${API_URL}/api/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        scanner_id: scannerId
      })
    });

    const result = await response.json();
    if (!result.success) {
      document.getElementById("result").innerHTML = `<p style="color:red;">${result.message}</p>`;
      return;
    }

    const data = result.data;
    let statusColor = "green";
    const normalizedStatus = String(data.status || "").toLowerCase();
    if (normalizedStatus === "terlambat") statusColor = "orange";
    if (normalizedStatus === "sangat terlambat") statusColor = "red";

    document.getElementById("result").innerHTML = `
      <p style="color:green; font-weight:bold;">Absensi berhasil</p>
      <p>Nama: ${data.student_name}</p>
      <p>Tanggal: ${data.attendance_date}</p>
      <p>Jam: ${data.attendance_time}</p>
      <p style="color:${statusColor}; font-weight:bold;">Status: ${String(data.status || "-").toUpperCase()}</p>
      <p>Scanner: ${data.scanner_id}</p>
    `;
    // ------------------------------------------

  } catch (error) {
    console.error("FETCH ERROR:", error);
    document.getElementById("result").innerHTML = `<p style="color:red;">Gagal koneksi ke server</p>`;
  }
}
function initScanner(scannerId) {
  const absenBtn = document.getElementById("absenBtn");
  const studentInput = document.getElementById("studentInput");

  // Untuk alat scanner (mode keyboard), fokuskan input otomatis
  if (studentInput) {
    studentInput.focus();
  }

  let isSubmitting = false;
  let lastSubmitAt = 0;

  async function submitFromInput() {
    if (!studentInput) return;
    const studentId = studentInput.value.trim();
    if (!studentId) return;
    if (isSubmitting) return;
    const now = Date.now();
    if (now - lastSubmitAt < 250) return;

    isSubmitting = true;
    lastSubmitAt = now;
    try {
      await saveAttendance(studentId, scannerId);
      // Siapkan untuk scan berikutnya
      studentInput.value = "";
      studentInput.focus();
    } finally {
      isSubmitting = false;
      // Pastikan fokus balik untuk scanner berikutnya
      if (studentInput) studentInput.focus();
    }
  }

  if (absenBtn) {
    absenBtn.addEventListener("click", () => {
      submitFromInput();
    });
  }

  // Saat alat scanner mengirim Enter, auto-submit
  if (studentInput) {
    studentInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitFromInput();
      }
    });

    // Banyak scanner berperilaku seperti keyboard; jaga fokus supaya tidak perlu klik lagi
    studentInput.addEventListener("blur", () => {
      setTimeout(() => studentInput.focus(), 0);
    });
  }

  let isProcessingScan = false;

  const scanner = new Html5QrcodeScanner(
    "reader",
    {
      fps: 10,
      qrbox: 250
    },
    false
  );

  scanner.render(
    async (decodedText) => {
      if (isProcessingScan) return;

      isProcessingScan = true;

      try {
        console.log("QR:", decodedText);

        const studentId = decodedText.trim();
        if (studentInput) studentInput.value = studentId;

        await saveAttendance(studentId, scannerId);

        document.getElementById("result").innerHTML += `
          <p style="color:blue;">Siap scan lagi dalam 3 detik...</p>
        `;
      } catch (error) {
        console.error(error);
      } finally {
        setTimeout(() => {
          isProcessingScan = false;
        }, 3000);
      }
    },
    () => {}
  );
}

export { initScanner };