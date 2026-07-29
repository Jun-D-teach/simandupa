import { API_URL } from "./config";

function getAdminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-key": localStorage.getItem("simAdminKey") || ""
  };
}

function formatDateForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export async function initStudentsPage() {
  const pageContainer = document.getElementById("studentsPageContent");
  if (!pageContainer) return;

  pageContainer.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:20px;">
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <input id="studentKeyword" type="text" placeholder="Cari nama / NIS / NISN / ID siswa" style="padding:10px; min-width:280px; border:1px solid #d1d5db; border-radius:10px;" />
        <input id="studentClassFilter" type="text" placeholder="Filter kelas" style="padding:10px; min-width:160px; border:1px solid #d1d5db; border-radius:10px;" />
        <button id="btnSearchStudents" style="padding:10px 14px; border:none; background:#2563eb; color:white; border-radius:10px; cursor:pointer;">
          Cari
        </button>
      </div>

      <button id="btnOpenStudentForm" style="padding:10px 14px; border:none; background:#16a34a; color:white; border-radius:10px; cursor:pointer; font-weight:bold;">
        + Tambah Siswa
      </button>
    </div>

    <div id="studentsResultMessage" style="margin-bottom:16px;"></div>

    <div id="studentFormWrap" style="display:none; margin-bottom:24px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:16px; padding:20px;"></div>

    <div style="overflow:auto; border:1px solid #e5e7eb; border-radius:16px;">
      <table style="width:100%; border-collapse:collapse; min-width:1100px;">
        <thead style="background:#0f172a; color:white;">
          <tr>
            <th style="padding:12px; text-align:left;">Student ID</th>
            <th style="padding:12px; text-align:left;">Nama</th>
            <th style="padding:12px; text-align:left;">NIS</th>
            <th style="padding:12px; text-align:left;">NISN</th>
            <th style="padding:12px; text-align:left;">Kelas</th>
            <th style="padding:12px; text-align:left;">JK</th>
            <th style="padding:12px; text-align:left;">No HP Ortu</th>
            <th style="padding:12px; text-align:left;">Status</th>
            <th style="padding:12px; text-align:center;">Aksi</th>
          </tr>
        </thead>
        <tbody id="studentsTableBody">
          <tr>
            <td colspan="9" style="padding:16px; text-align:center;">Memuat data siswa...</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const formWrap = document.getElementById("studentFormWrap");
  const resultMessage = document.getElementById("studentsResultMessage");

  function showMessage(message, type = "success") {
    resultMessage.innerHTML = `
      <div style="
        padding:12px 14px;
        border-radius:10px;
        background:${type === "success" ? "#dcfce7" : "#fee2e2"};
        color:${type === "success" ? "#166534" : "#991b1b"};
        border:1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"};
      ">
        ${message}
      </div>
    `;
  }
async function loadClassDropdownOptions(selectedClassId = "") {
  try {
    const response = await fetch(`${API_URL}/api/classes`, {
      headers: {
        "x-admin-key": localStorage.getItem("simAdminKey") || ""
      }
    });

    const result = await response.json();

    if (!result.success) return "";

    return result.data.map((item) => {
      const selected = item.class_id === selectedClassId ? "selected" : "";
      return `<option value="${item.class_id}" ${selected}>${item.class_name || item.class_id}</option>`;
    }).join("");
  } catch (error) {
    console.error("Load class options error:", error);
    return "";
  }
}

  async function renderForm(data = null) {
    const isEdit = !!data;
    const classOptionsHtml = await loadClassDropdownOptions(data?.class_id || "");

    formWrap.style.display = "block";
    formWrap.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px;">
        <h3 style="margin:0;">${isEdit ? "Edit Siswa" : "Tambah Siswa"}</h3>
        <button id="btnCloseStudentForm" style="border:none; background:#e5e7eb; padding:8px 12px; border-radius:8px; cursor:pointer;">Tutup</button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(2, minmax(260px, 1fr)); gap:14px 18px;">
        <div>
          <label><b>Student ID</b></label>
          <input id="form_student_id" ${isEdit ? "disabled" : ""} value="${data?.student_id || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>Nama Siswa</b></label>
          <input id="form_student_name" value="${data?.student_name || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>NIS</b></label>
          <input id="form_nis" value="${data?.nis || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>NISN</b></label>
          <input id="form_nisn" value="${data?.nisn || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>
<div style="grid-column:1 / -1; padding:12px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; color:#1e40af;">
  <b>Info Akun Siswa:</b><br />
  Username siswa otomatis menggunakan <b>NISN</b>.<br />
  Password default: <b>default12345</b>
</div>
        <div>
          <label><b>Jenis Kelamin</b></label>
          <select id="form_gender" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;">
            <option value="">Pilih</option>
            <option value="L" ${data?.gender === "L" ? "selected" : ""}>Laki-laki</option>
            <option value="P" ${data?.gender === "P" ? "selected" : ""}>Perempuan</option>
          </select>
        </div>

        <div>
  <label><b>Kelas</b></label>
  <select id="form_class_id" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;">
    <option value="">Pilih Kelas</option>
    ${classOptionsHtml}
  </select>
</div>

        <div>
          <label><b>Tempat Lahir</b></label>
          <input id="form_birth_place" value="${data?.birth_place || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>Tanggal Lahir</b></label>
          <input id="form_birth_date" type="date" value="${formatDateForInput(data?.birth_date)}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>Agama</b></label>
         <div>
 
  <select id="form_religion" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;">
    <option value="">Pilih Agama</option>
    <option value="Islam" ${data?.religion === "Islam" || data?.religion === "islam" ? "selected" : ""}>Islam</option>
    <option value="Kristen" ${data?.religion === "Kristen" ? "selected" : ""}>Kristen</option>
    <option value="Katolik" ${data?.religion === "Katolik" ? "selected" : ""}>Katolik</option>
    <option value="Hindu" ${data?.religion === "Hindu" ? "selected" : ""}>Hindu</option>
    <option value="Buddha" ${data?.religion === "Buddha" ? "selected" : ""}>Buddha</option>
    <option value="Konghucu" ${data?.religion === "Konghucu" ? "selected" : ""}>Konghucu</option>
  </select>
</div>
        </div>

        <div>
          <label><b>Tahun Masuk</b></label>
          <input id="form_entry_year" value="${data?.entry_year || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>Nama Orang Tua</b></label>
          <input id="form_parent_name" value="${data?.parent_name || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>No HP Orang Tua</b></label>
          <input id="form_parent_phone" value="${data?.parent_phone || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>Email Orang Tua</b></label>
          <input id="form_parent_email" value="${data?.parent_email || ""}" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label><b>Relasi</b></label>
          <select id="form_parent_relation" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;">
            <option value="">Pilih</option>
            <option value="ayah" ${data?.parent_relation === "ayah" ? "selected" : ""}>Ayah</option>
            <option value="ibu" ${data?.parent_relation === "ibu" ? "selected" : ""}>Ibu</option>
            <option value="wali" ${data?.parent_relation === "wali" ? "selected" : ""}>Wali</option>
          </select>
        </div>

        <div style="grid-column:1 / -1;">
          <label><b>Alamat</b></label>
          <textarea id="form_address" rows="3" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;">${data?.address || ""}</textarea>
        </div>
      </div>
<div>
  <label><b>Status</b></label>
  <select id="form_status_active" style="width:100%; padding:10px; margin-top:6px; border:1px solid #d1d5db; border-radius:10px;">
    <option value="aktif" ${data?.status_active === "aktif" || !data?.status_active ? "selected" : ""}>Aktif</option>
    <option value="nonaktif" ${data?.status_active === "nonaktif" ? "selected" : ""}>Nonaktif</option>
  </select>
</div>
      <div style="margin-top:18px; display:flex; gap:10px; flex-wrap:wrap;">
        <button id="btnSaveStudent" style="padding:10px 16px; border:none; background:#2563eb; color:white; border-radius:10px; cursor:pointer;">
          ${isEdit ? "Update Siswa" : "Simpan Siswa"}
        </button>
      </div>
    `;
    if (!isEdit) {
    generateStudentId();
  }

  console.log("DATA EDIT FORM:", data);

if (data?.qr_code && data.qr_code.startsWith("data:image")) {
  console.log("QR ADA, tampilkan preview");
  console.log("QR PREFIX:", data.qr_code.slice(0, 50));

  const qrPreview = document.createElement("div");
  qrPreview.style.marginTop = "20px";
  qrPreview.innerHTML = `
    <div style="padding:16px; background:white; border:1px solid #e5e7eb; border-radius:14px;">
      <div style="font-weight:bold; margin-bottom:10px;">QR Code Siswa</div>
      <img
        src="${data.qr_code}"
        alt="QR Code ${data.student_id}"
        style="max-width:180px; width:100%; border:1px solid #e5e7eb; border-radius:10px; padding:10px; background:white;"
      />
    </div>
  `;
  formWrap.appendChild(qrPreview);
}
  document.getElementById("btnCloseStudentForm")?.addEventListener("click", () => {
    formWrap.style.display = "none";
    formWrap.innerHTML = "";
  });

  document.getElementById("btnSaveStudent")?.addEventListener("click", async () => {
    try {
      const payload = {
        student_id: document.getElementById("form_student_id")?.value.trim(),
        student_name: document.getElementById("form_student_name")?.value.trim(),
        nis: document.getElementById("form_nis")?.value.trim(),
        nisn: document.getElementById("form_nisn")?.value.trim(),
        gender: document.getElementById("form_gender")?.value,
        class_id: document.getElementById("form_class_id")?.value.trim(),
        birth_place: document.getElementById("form_birth_place")?.value.trim(),
        birth_date: document.getElementById("form_birth_date")?.value,
        religion: document.getElementById("form_religion")?.value.trim(),
        entry_year: document.getElementById("form_entry_year")?.value.trim(),
        parent_name: document.getElementById("form_parent_name")?.value.trim(),
        parent_phone: document.getElementById("form_parent_phone")?.value.trim().replace(/\s+/g, ""),
        parent_email: document.getElementById("form_parent_email")?.value.trim(),
        parent_relation: document.getElementById("form_parent_relation")?.value,
        address: document.getElementById("form_address")?.value.trim(),
        status_active: document.getElementById("form_status_active")?.value
      };

      const validationMessage = validateStudentPayload(payload, isEdit);

      if (validationMessage) {
        showMessage(validationMessage, "error");
        return;
      }

      const url = isEdit
        ? `${API_URL}/api/students/${data.student_id}`
        : `${API_URL}/api/students`;

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        showMessage(result.message || "Gagal menyimpan data siswa", "error");
        return;
      }

      showMessage(result.message || "Data siswa berhasil disimpan", "success");
      formWrap.style.display = "none";
      formWrap.innerHTML = "";
      await loadStudents();
    } catch (error) {
      console.error("Save student error:", error);
      showMessage("Terjadi kesalahan saat menyimpan data siswa", "error");
    }
  });
}
  
async function generateStudentId() {
  try {
    const response = await fetch(`${API_URL}/api/students/generate-id`, {
      headers: {
        "x-admin-key": localStorage.getItem("simAdminKey") || ""
      }
    });

    const result = await response.json();

    if (result.success) {
      const input = document.getElementById("form_student_id");
      if (input) {
        input.value = result.student_id;
      }
    }
  } catch (error) {
    console.error("Generate ID error:", error);
  }
}
function validateStudentPayload(payload, isEdit = false) {
  if (!isEdit && !payload.student_id) {
    return "Student ID wajib diisi.";
  }

  if (!payload.student_name) {
    return "Nama siswa wajib diisi.";
  }
if (!payload.nisn) {
  return "NISN wajib diisi karena akan digunakan sebagai username siswa.";
}
  if (!payload.class_id) {
    return "Kelas wajib diisi.";
  }

  if (!payload.gender) {
    return "Jenis kelamin wajib dipilih.";
  }

  if (payload.entry_year) {
    const yearText = String(payload.entry_year).trim();
    if (!/^\d{4}$/.test(yearText)) {
      return "Tahun masuk harus 4 digit, contoh: 2024.";
    }
  }

  if (payload.parent_phone) {
    const phone = String(payload.parent_phone).replace(/\s+/g, "");
    if (!/^\d+$/.test(phone)) {
      return "No HP orang tua hanya boleh angka.";
    }
  }

  if (payload.birth_date) {
    const selectedDate = new Date(payload.birth_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDate.getTime())) {
      return "Tanggal lahir tidak valid.";
    }

    if (selectedDate > today) {
      return "Tanggal lahir tidak boleh melebihi hari ini.";
    }
  }

  return null;
}

function renderQrPreview(studentId, qrCode) {
  const formWrap = document.getElementById("studentFormWrap");
  if (!formWrap) return;

  formWrap.style.display = "block";
  formWrap.innerHTML = `
    <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:16px; padding:20px; text-align:center;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="margin:0;">QR Code Siswa</h3>
        <button id="btnCloseQrPreview" style="border:none; background:#e5e7eb; padding:8px 12px; border-radius:8px; cursor:pointer;">Tutup</button>
      </div>

      <p style="margin-bottom:16px; color:#475569;">
        Student ID: <b>${studentId}</b>
      </p>

      <div style="background:white; border:1px solid #e5e7eb; border-radius:16px; padding:20px; display:inline-block;">
        <img src="${qrCode}" alt="QR Code ${studentId}" style="max-width:220px; width:100%;" />
      </div>

      <div style="margin-top:16px;">
        <a href="${qrCode}" download="${studentId}.png" style="display:inline-block; padding:10px 14px; background:#16a34a; color:white; text-decoration:none; border-radius:10px;">
          Download QR
        </a>
      </div>
    </div>
  `;

  document.getElementById("btnCloseQrPreview")?.addEventListener("click", () => {
    formWrap.style.display = "none";
    formWrap.innerHTML = "";
  });
}
  async function loadStudents() {
    const tbody = document.getElementById("studentsTableBody");
    const keyword = document.getElementById("studentKeyword")?.value.trim() || "";
    const classId = document.getElementById("studentClassFilter")?.value.trim() || "";

    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="padding:16px; text-align:center;">Memuat data siswa...</td>
      </tr>
    `;

    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (classId) params.append("classId", classId);

      const response = await fetch(`${API_URL}/api/students?${params.toString()}`, {
        headers: {
          "x-admin-key": localStorage.getItem("simAdminKey") || ""
        }
      });

      const result = await response.json();

      if (!result.success) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="padding:16px; text-align:center; color:red;">${result.message || "Gagal memuat data"}</td>
          </tr>
        `;
        return;
      }

      if (!result.data || result.data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="padding:16px; text-align:center;">Belum ada data siswa.</td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = result.data.map((student) => `
        <tr>
          <td style="padding:12px; border-top:1px solid #e5e7eb;">${student.student_id || "-"}</td>
          <td style="padding:12px; border-top:1px solid #e5e7eb;">${student.student_name || "-"}</td>
          <td style="padding:12px; border-top:1px solid #e5e7eb;">${student.nis || "-"}</td>
          <td style="padding:12px; border-top:1px solid #e5e7eb;">${student.nisn || "-"}</td>
          <td style="padding:12px; border-top:1px solid #e5e7eb;">${student.class_id || "-"}</td>
          <td style="padding:12px; border-top:1px solid #e5e7eb;">${student.gender || "-"}</td>
          <td style="padding:12px; border-top:1px solid #e5e7eb;">${student.parent_phone || "-"}</td>
          <td style="padding:12px; border-top:1px solid #e5e7eb;">${student.status_active || "-"}</td>
          <td style="padding:12px; border-top:1px solid #e5e7eb; text-align:center;">
            <button class="btn-edit-student" data-id="${student.student_id}" style="padding:6px 10px; border:none; background:#f59e0b; color:white; border-radius:8px; cursor:pointer; margin-right:6px;">Edit</button>
<button class="btn-generate-qr" data-id="${student.student_id}" style="padding:6px 10px; border:none; background:#2563eb; color:white; border-radius:8px; cursor:pointer; margin-right:6px;">QR</button>
<button class="btn-delete-student" data-id="${student.student_id}" style="padding:6px 10px; border:none; background:#dc2626; color:white; border-radius:8px; cursor:pointer;">Hapus</button>
</td>
        </tr>
      `).join("");

      document.querySelectorAll(".btn-edit-student").forEach((button) => {
        button.addEventListener("click", async () => {
          const studentId = button.dataset.id;

          try {
            
           const response = await fetch(`${API_URL}/api/students/${studentId}?t=${Date.now()}`, {
                
              headers: {
                "x-admin-key": localStorage.getItem("simAdminKey") || ""
              }
            });

            const result = await response.json();

            if (!result.success) {
              showMessage(result.message || "Gagal mengambil detail siswa", "error");
              return;
            }
console.log("DETAIL SISWA:", result.data);
            await renderForm(result.data);
          } catch (error) {
            console.error("Load student detail error:", error);
            showMessage("Terjadi kesalahan saat mengambil detail siswa", "error");
          }
        });
      });
document.querySelectorAll(".btn-generate-qr").forEach((button) => {
  button.addEventListener("click", async () => {
    const studentId = button.dataset.id;

    try {
      const response = await fetch(`${API_URL}/api/students/${studentId}/generate-qr`, {
        method: "POST",
        headers: {
          "x-admin-key": localStorage.getItem("simAdminKey") || ""
        }
      });

      const result = await response.json();

      if (!result.success) {
        showMessage(result.message || "Gagal membuat QR siswa", "error");
        return;
      }

      showMessage(`QR Code untuk ${studentId} berhasil dibuat.`, "success");
        await loadStudents();
        renderQrPreview(studentId, result.data.qr_code);        
    } catch (error) {
      console.error("Generate QR error:", error);
      showMessage("Terjadi kesalahan saat membuat QR siswa", "error");
    }
  });
});
      document.querySelectorAll(".btn-delete-student").forEach((button) => {
        button.addEventListener("click", async () => {
          const studentId = button.dataset.id;
          const confirmed = confirm(`Yakin ingin menghapus siswa ${studentId}?`);

          if (!confirmed) return;

          try {
            
            const response = await fetch(`${API_URL}/api/students/${studentId}`, {
              method: "DELETE",
              headers: {
                "x-admin-key": localStorage.getItem("simAdminKey") || ""
              }
            });

            const result = await response.json();

            if (!result.success) {
              showMessage(result.message || "Gagal menghapus siswa", "error");
              return;
            }

            showMessage(result.message || "Data siswa berhasil dihapus", "success");
            await loadStudents();
          } catch (error) {
            console.error("Delete student error:", error);
            showMessage("Terjadi kesalahan saat menghapus siswa", "error");
          }
        });
      });
    } catch (error) {
      console.error("Load students error:", error);
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="padding:16px; text-align:center; color:red;">Terjadi kesalahan saat memuat data siswa.</td>
        </tr>
      `;
    }
  }

  document.getElementById("btnOpenStudentForm")?.addEventListener("click", async () => {
  await renderForm();
});

  document.getElementById("btnSearchStudents")?.addEventListener("click", () => {
    loadStudents();
  });

  await loadStudents();
}