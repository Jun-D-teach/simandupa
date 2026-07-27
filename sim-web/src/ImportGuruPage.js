import { useState } from "react";

function ImportGuruPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Pilih file Excel terlebih dahulu");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:3000/api/import/teachers", {
        method: "POST",
        headers: {
          "x-admin-key": localStorage.getItem("simAdminKey"),
        },
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert(`Import berhasil!\nTotal: ${data.total}\nBerhasil: ${data.inserted}\nDilewati: ${data.skipped}`);
      } else {
        alert(`Import gagal: ${data.message}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Import Data Guru</h1>
      <p className="text-gray-600 mb-6">
        Upload file Excel untuk memasukkan data guru ke MySQL.
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Pilih file Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Mengupload..." : "Upload Excel"}
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded ${
            result.success ? "bg-green-50" : "bg-red-50"
          }`}>
            <h3 className="font-bold mb-2">
              {result.success ? "✅ Import Berhasil" : "❌ Import Gagal"}
            </h3>
            <p>Total data: {result.total}</p>
            <p>Berhasil: {result.inserted}</p>
            <p>Dilewati: {result.skipped}</p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Error:</p>
                <ul className="list-disc list-inside text-sm">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>
                      Baris {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h4 className="font-bold mb-2">Format Excel:</h4>
          <ul className="text-sm list-disc list-inside">
            <li>Kolom wajib: <b>teacher_id</b>, <b>teacher_name</b></li>
            <li>Salah satu harus ada: <b>nip</b> atau <b>email</b> (untuk username)</li>
            <li>Kolom opsional: phone, status_active, roles</li>
            <li>Roles dipisah koma (contoh: guru,wali_kelas)</li>
            <li>Password default: default12345</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
app.get("/api/templates/teachers", verifyAdminApiKey, (req, res) => {
  const XLSX = require("xlsx");
  
  const data = [
    {
      teacher_id: "TCH-2026-0005",
      teacher_name: "Ahmad Sudirman",
      nip: "198501012010011001",
      phone: "081234567890",
      email: "ahmad@madrasah.sch.id",
      status_active: "aktif",
      roles: "guru,wali_kelas",
    },
    {
      teacher_id: "TCH-2026-0006",
      teacher_name: "Siti Nurhaliza",
      nip: "198602022011012002",
      phone: "081234567891",
      email: "siti@madrasah.sch.id",
      status_active: "aktif",
      roles: "guru,bk",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Guru");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=template_import_guru.xlsx"
  );
  res.send(buffer);
});
export default ImportGuruPage;