// src/importPage.js
import * as XLSX from 'xlsx';
import { API_URL } from "./config";

async function initImportPage() {
  const uploadBtn = document.getElementById("uploadSiswaBtn");
  const excelFile = document.getElementById("excelSiswaFile");
  const importResult = document.getElementById("importSiswaResult");
  const downloadTemplateBtn = document.getElementById("downloadSiswaTemplateBtn");

  console.log("=== INIT IMPORT PAGE ===");
  console.log("uploadBtn:", uploadBtn ? "✅ Ada" : " Tidak ada");
  console.log("excelFile:", excelFile ? "✅ Ada" : "❌ Tidak ada");
  console.log("importResult:", importResult ? "✅ Ada" : "❌ Tidak ada");
  console.log("downloadTemplateBtn:", downloadTemplateBtn ? "✅ Ada" : "❌ Tidak ada");
  console.log("========================");

  // Cek adminKey
  const adminKey = localStorage.getItem("simAdminKey") || "";
  console.log("Admin Key:", adminKey ? "✅ Ada" : "❌ Tidak ada");

  // 1. Fitur Download Template (TETAP JALAN WALAUPUN INPUT FILE NULL)
  if (downloadTemplateBtn) {
    console.log("✅ Event listener download template dipasang");
    
    downloadTemplateBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("📥 Tombol download template diklik!");
      
      if (!adminKey) {
        alert("⚠️ Anda harus login sebagai admin terlebih dahulu!");
        return;
      }
      
      downloadTemplateBtn.textContent = "⏳ Membuat template...";
      downloadTemplateBtn.disabled = true;
      
      try {
        const wb = XLSX.utils.book_new();
        
        // Kolom sesuai struktur tabel students di database
        const data = [
          [
            "student_id", 
            "nis", 
            "nisn", 
            "student_name", 
            "gender", 
            "birth_place", 
            "birth_date", 
            "address", 
            "religion", 
            "class_id", 
            "entry_year", 
            "status_active", 
            "parent_name", 
            "parent_phone", 
            "parent_email", 
            "parent_relation"
          ],
          // Contoh data 1
          [
            "STD-2026-0001",
            "12345",
            "0012345678",
            "Contoh Nama Siswa",
            "L",
            "Palembang",
            "2008-01-01",
            "Jl. Contoh No. 1",
            "Islam",
            "7A",
            "2025",
            "aktif",
            "Nama Orang Tua",
            "08123456789",
            "orangtua@email.com",
            "ayah"
          ],
          // Contoh data 2
          [
            "STD-2026-0002",
            "12346",
            "0012345679",
            "Nama Siswa Kedua",
            "P",
            "Palembang",
            "2008-02-02",
            "Jl. Contoh No. 2",
            "Islam",
            "8A",
            "2024",
            "aktif",
            "Nama Ibu",
            "08123456788",
            "ibu@email.com",
            "ibu"
          ],
          // Baris kosong
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        
        ws['!cols'] = [
          { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, 
          { wch: 8 },  { wch: 20 }, { wch: 15 }, { wch: 35 }, 
          { wch: 12 }, { wch: 10 }, { wch: 8 },  { wch: 12 }, 
          { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 10 }
        ];

        // Style header
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

        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "template_import_siswa.xlsx");
        
        console.log("✅ Template berhasil dibuat dan diunduh!");
        downloadTemplateBtn.textContent = "✅ Template diunduh";
        
        setTimeout(() => {
          downloadTemplateBtn.textContent = "⬇️ Download Template Excel Siswa";
          downloadTemplateBtn.disabled = false;
        }, 2000);
        
      } catch (error) {
        console.error("❌ Generate template error:", error);
        alert("❌ Gagal membuat template: " + error.message);
        downloadTemplateBtn.textContent = "⬇️ Download Template Excel Siswa";
        downloadTemplateBtn.disabled = false;
      }
    });
  } else {
    console.warn("⚠️ Tombol downloadSiswaTemplateBtn tidak ditemukan di HTML");
  }

  // 2. Fitur Upload File (HANYA JIKA SEMUA ELEMEN ADA)
  if (uploadBtn && excelFile && importResult) {
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

        const response = await fetch(`${API_URL}/api/import/students`, {
          method: "POST",
          headers: { "x-admin-key": currentAdminKey },
          body: formData
        });

        const result = await response.json();
        console.log("IMPORT SISWA RESULT:", result);

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
        console.error("IMPORT SISWA UI ERROR:", error);
        importResult.innerHTML = `<p class="text-red-600 font-bold">Gagal koneksi ke server.</p>`;
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload Excel";
      }
    });
  } else {
    console.warn("⚠️ Upload functionality disabled - missing elements");
  }
}

export { initImportPage };