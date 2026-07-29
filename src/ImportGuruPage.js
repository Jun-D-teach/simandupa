// src/importGuruPage.js
import * as XLSX from 'xlsx';
import { API_URL } from "./config";

async function initImportGuruPage() {
  const uploadBtn = document.getElementById("uploadGuruBtn");
  const excelFile = document.getElementById("excelGuruFile");
  const importResult = document.getElementById("importGuruResult");
  const downloadTemplateBtn = document.getElementById("downloadGuruTemplateBtn");

  if (!uploadBtn || !excelFile || !importResult) return;

  // Cek adminKey saja (yang penting untuk API call)
  const adminKey = localStorage.getItem("simAdminKey") || "";
  
  // DEBUG: Lihat di console apa yang tersimpan
  console.log("=== DEBUG IMPORT GURU ===");
  console.log("Admin Key:", adminKey ? "✅ Ada" : "❌ Tidak ada");
  console.log("User Role:", localStorage.getItem("simUserRole"));
  console.log("Semua localStorage keys:", Object.keys(localStorage));
  console.log("========================");

  // Tampilkan info status
  const statusDiv = document.createElement("div");
  statusDiv.className = "mb-4 p-3 rounded text-sm";
  
  if (!adminKey) {
    statusDiv.className += " bg-red-50 text-red-700";
    statusDiv.innerHTML = `
      <p class="font-bold">❌ Admin Key tidak ditemukan!</p>
      <p class="mt-1">Silakan login ulang sebagai admin.</p>
      <a href="#login" class="text-blue-600 hover:underline mt-2 inline-block">Login sekarang →</a>
    `;
    uploadBtn.disabled = true;
    if (downloadTemplateBtn) downloadTemplateBtn.disabled = true;
  } else {
    statusDiv.className += " bg-green-50 text-green-700";
    statusDiv.innerHTML = `
      <p class="font-bold">✅ Login terdeteksi sebagai Admin</p>
      <p class="text-xs mt-1">Admin Key: ${adminKey.substring(0, 10)}...</p>
    `;
  }
  
  importResult.parentNode.insertBefore(statusDiv, importResult);

  // 1. Fitur Download Template (GENERATE DI FRONTEND)
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      if (!adminKey) {
        alert("⚠️ Anda harus login sebagai admin terlebih dahulu!");
        return;
      }
      
      downloadTemplateBtn.textContent = " Membuat template...";
      
      try {
        const wb = XLSX.utils.book_new();
        
        const data = [
          ["teacher_id", "teacher_name", "nip", "email", "phone", "status_active", "roles"],
          ["GURU001", "Contoh Nama Guru", "199001012020011001", "guru@man2palembang.sch.id", "08123456789", "1", "guru,wali_kelas"],
          ["GURU002", "Nama Guru Kedua", "199102022021021002", "guru2@man2palembang.sch.id", "08123456788", "1", "guru"],
          ["", "", "", "", "", "", ""],
          ["", "", "", "", "", "", ""],
          ["", "", "", "", "", "", ""],
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        
        ws['!cols'] = [
          { wch: 15 }, { wch: 30 }, { wch: 20 }, 
          { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
        ];

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_col(C) + "1";
          if (!ws[address]) continue;
          ws[address].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" }, patternType: "solid" },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }

        XLSX.utils.book_append_sheet(wb, ws, "Teachers");
        XLSX.writeFile(wb, "template_import_guru.xlsx");
        
        downloadTemplateBtn.textContent = "✅ Template diunduh";
        setTimeout(() => {
          downloadTemplateBtn.textContent = "️ Download Template Excel Guru";
        }, 2000);
        
      } catch (error) {
        console.error("Generate template error:", error);
        alert("❌ Gagal membuat template: " + error.message);
        downloadTemplateBtn.textContent = "⬇️ Download Template Excel Guru";
      }
    });
  }

  // 2. Fitur Upload File
  uploadBtn.addEventListener("click", async () => {
    try {
      const file = excelFile.files[0];
      const currentAdminKey = localStorage.getItem("simAdminKey") || "";

      if (!currentAdminKey) {
        importResult.innerHTML = `<p class="text-red-600 font-bold">❌ Anda harus login sebagai admin!</p>`;
        return;
      }

      if (!file) {
        importResult.innerHTML = `<p class="text-red-600 font-bold">Silakan pilih file Excel terlebih dahulu.</p>`;
        return;
      }

      uploadBtn.disabled = true;
      uploadBtn.textContent = "⏳ Mengupload...";

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/import/teachers`, {
        method: "POST",
        headers: { "x-admin-key": currentAdminKey },
        body: formData
      });

      const result = await response.json();
      console.log("IMPORT GURU RESULT:", result);

      if (!result.success) {
        importResult.innerHTML = `
          <p class="text-red-600 font-bold mb-2">❌ ${result.message || "Import gagal."}</p>
          ${result.errors ? `
            <details class="mt-2">
              <summary class="cursor-pointer text-sm text-red-600">Lihat detail error (${result.errors.length})</summary>
              <ul class="mt-2 bg-red-50 p-3 rounded text-sm text-red-700 max-h-40 overflow-y-auto">
                ${result.errors.map(err => `<li>Baris ${err.row}: ${err.message}</li>`).join('')}
              </ul>
            </details>
          ` : `<pre class="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">${JSON.stringify(result, null, 2)}</pre>`}
        `;
        return;
      }

      importResult.innerHTML = `
        <p class="text-green-600 font-bold mb-2">✅ Import berhasil!</p>
        <ul class="text-sm space-y-1">
          <li>Total data diproses: <b>${result.total}</b></li>
          <li>Berhasil dimasukkan/diupdate: <b>${result.inserted}</b></li>
          <li>Dilewati (error): <b>${result.skipped}</b></li>
        </ul>
      `;
      
      excelFile.value = "";

    } catch (error) {
      console.error("IMPORT GURU UI ERROR:", error);
      importResult.innerHTML = `<p class="text-red-600 font-bold">Gagal koneksi ke server.</p>`;
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload Excel";
    }
  });
}

export { initImportGuruPage };