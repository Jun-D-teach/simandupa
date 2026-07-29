import { API_URL } from "./config";

async function initImportPage() {
  const uploadBtn = document.getElementById("uploadBtn");
  const excelFile = document.getElementById("excelFile");
  const importResult = document.getElementById("importResult");

  if (!uploadBtn || !excelFile || !importResult) return;

  uploadBtn.addEventListener("click", async () => {
    try {
      const file = excelFile.files[0];
      const adminKey = localStorage.getItem("simAdminKey") || "";

      if (!file) {
        importResult.innerHTML = `
          <p style="color:red; font-weight:bold;">Silakan pilih file Excel terlebih dahulu.</p>
        `;
        return;
      }

      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/import/students`, {
        method: "POST",
        headers: {
          "x-admin-key": adminKey
        },
        body: formData
      });

      const result = await response.json();
      console.log("IMPORT RESULT:", result);

      if (!result.success) {
        importResult.innerHTML = `
          <p style="color:red; font-weight:bold;">${result.message || "Import gagal."}</p>
          <pre style="background:#fff; padding:10px; border-radius:8px; overflow:auto;">${JSON.stringify(result, null, 2)}</pre>
        `;
        return;
      }

      importResult.innerHTML = `
        <p style="color:green; font-weight:bold;">Import berhasil.</p>
        <p>Total data diproses: <b>${result.total}</b></p>
      `;
    } catch (error) {
      console.error("IMPORT UI ERROR:", error);
      importResult.innerHTML = `
        <p style="color:red; font-weight:bold;">Gagal koneksi ke server.</p>
      `;
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload Excel";
    }
  });
}

export { initImportPage };