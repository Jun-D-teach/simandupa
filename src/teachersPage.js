const API_URL = "http://localhost:3000";

function getAdminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-key": localStorage.getItem("simAdminKey") || ""
  };
}

export async function initTeachersPage() {
  const box = document.getElementById("teachersPageContent");
  if (!box) return;

  let editingTeacherId = null;

  box.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(2,minmax(260px,1fr)); gap:14px; margin-bottom:20px;">
      <div>
        <label><b>ID Guru</b></label>
        <input id="teacher_id" readonly style="width:100%; padding:10px; margin-top:6px;" />
      </div>

      <div>
        <label><b>Nama Guru</b></label>
        <input id="teacher_name" style="width:100%; padding:10px; margin-top:6px;" />
      </div>

      <div>
        <label><b>NIP</b></label>
        <input id="nip" style="width:100%; padding:10px; margin-top:6px;" />
      </div>

      <div>
        <label><b>No HP</b></label>
        <input id="phone" style="width:100%; padding:10px; margin-top:6px;" />
      </div>

      <div>
        <label><b>Email</b></label>
        <input id="email" style="width:100%; padding:10px; margin-top:6px;" />
      </div>

      <div>
        <label><b>Status</b></label>
        <select id="status_active" style="width:100%; padding:10px; margin-top:6px;">
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      <div style="grid-column:1 / -1;">
        <label><b>Role / Tugas</b></label>
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:8px;">
          <label><input type="checkbox" class="teacherRole" value="guru" checked /> Guru</label>
          <label><input type="checkbox" class="teacherRole" value="wali_kelas" /> Wali Kelas</label>
          <label><input type="checkbox" class="teacherRole" value="bk" /> BK</label>
          <label><input type="checkbox" class="teacherRole" value="pegawai" /> Pegawai</label>
          <label><input type="checkbox" class="teacherRole" value="admin" /> Admin</label>
          <label><input type="checkbox" class="teacherRole" value="kepala_madrasah" /> Kepala Madrasah</label>
        </div>
      </div>
    </div>

    <div style="margin-bottom:20px;">
      <button id="saveTeacherBtn" style="padding:10px 14px; background:#2563eb; color:white; border:none; border-radius:8px;">
        Simpan Guru
      </button>

      <button id="resetTeacherBtn" style="padding:10px 14px; background:#64748b; color:white; border:none; border-radius:8px;">
        Reset
      </button>
    </div>

    <div id="teacherResult" style="margin-bottom:14px;"></div>

    <div style="overflow:auto;">
      <table style="width:100%; border-collapse:collapse; min-width:900px;">
        <thead>
          <tr style="background:#0f172a; color:white;">
            <th style="padding:10px;">ID</th>
            <th>Nama</th>
            <th>NIP</th>
            <th>No HP</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="teachersTableBody">
          <tr><td colspan="8" style="padding:12px;">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  function getSelectedRoles() {
    return Array.from(document.querySelectorAll(".teacherRole:checked")).map((item) => item.value);
  }

  function setSelectedRoles(roles = []) {
    document.querySelectorAll(".teacherRole").forEach((checkbox) => {
      checkbox.checked = roles.includes(checkbox.value);
    });

    const guruRole = document.querySelector('.teacherRole[value="guru"]');
    if (guruRole && !roles.length) guruRole.checked = true;
  }

  async function generateTeacherId() {
    if (editingTeacherId) return;

    const res = await fetch(`${API_URL}/api/teachers/generate-id`, {
      headers: {
        "x-admin-key": localStorage.getItem("simAdminKey") || ""
      }
    });

    const result = await res.json();

    if (result.success) {
      document.getElementById("teacher_id").value = result.teacher_id;
    }
  }

  function resetForm() {
    editingTeacherId = null;
    document.getElementById("teacher_id").value = "";
    document.getElementById("teacher_name").value = "";
    document.getElementById("nip").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("email").value = "";
    document.getElementById("status_active").value = "aktif";
    setSelectedRoles(["guru"]);
    document.getElementById("saveTeacherBtn").innerText = "Simpan Guru";
    generateTeacherId();
  }

  async function loadTeachers() {
    const tbody = document.getElementById("teachersTableBody");

    const res = await fetch(`${API_URL}/api/teachers`, {
      headers: {
        "x-admin-key": localStorage.getItem("simAdminKey") || ""
      }
    });

    const result = await res.json();

    if (!result.success) {
      tbody.innerHTML = `<tr><td colspan="8" style="padding:12px;">Gagal memuat data guru</td></tr>`;
      return;
    }

    if (!result.data.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="padding:12px;">Belum ada data guru.</td></tr>`;
      return;
    }

    tbody.innerHTML = result.data.map((teacher) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${teacher.teacher_id || "-"}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${teacher.teacher_name || "-"}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${teacher.nip || "-"}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${teacher.phone || "-"}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${teacher.email || "-"}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${teacher.roles || "-"}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">${teacher.status_active || "-"}</td>
        <td style="padding:10px; border-bottom:1px solid #ddd;">
          <button class="editTeacherBtn" data-id="${teacher.teacher_id}" style="padding:6px 10px;">Edit</button>
          <button class="deleteTeacherBtn" data-id="${teacher.teacher_id}" style="padding:6px 10px; background:#dc2626; color:white; border:none;">Hapus</button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll(".editTeacherBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const teacherId = btn.dataset.id;

        const res = await fetch(`${API_URL}/api/teachers/${teacherId}`, {
          headers: {
            "x-admin-key": localStorage.getItem("simAdminKey") || ""
          }
        });

        const result = await res.json();

        if (!result.success) {
          document.getElementById("teacherResult").innerHTML = result.message;
          return;
        }

        const data = result.data;
        editingTeacherId = data.teacher_id;

        document.getElementById("teacher_id").value = data.teacher_id || "";
        document.getElementById("teacher_name").value = data.teacher_name || "";
        document.getElementById("nip").value = data.nip || "";
        document.getElementById("phone").value = data.phone || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("status_active").value = data.status_active || "aktif";
        setSelectedRoles(data.roles || ["guru"]);
        document.getElementById("saveTeacherBtn").innerText = "Update Guru";
      });
    });

    document.querySelectorAll(".deleteTeacherBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const teacherId = btn.dataset.id;

        if (!confirm(`Hapus guru ${teacherId}?`)) return;

        const res = await fetch(`${API_URL}/api/teachers/${teacherId}`, {
          method: "DELETE",
          headers: getAdminHeaders()
        });

        const result = await res.json();
        document.getElementById("teacherResult").innerHTML = result.message;

        await loadTeachers();
        resetForm();
      });
    });
  }

  document.getElementById("saveTeacherBtn").addEventListener("click", async () => {
    const teacherId = document.getElementById("teacher_id").value.trim();
    const teacherName = document.getElementById("teacher_name").value.trim();
    const nip = document.getElementById("nip").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const statusActive = document.getElementById("status_active").value;
    const roles = getSelectedRoles();

    if (!teacherId || !teacherName) {
      document.getElementById("teacherResult").innerHTML = "ID dan nama guru wajib diisi.";
      return;
    }

    if (!nip && !email) {
      document.getElementById("teacherResult").innerHTML = "NIP atau email wajib diisi untuk login guru.";
      return;
    }

    const isEdit = !!editingTeacherId;

    const url = isEdit
      ? `${API_URL}/api/teachers/${editingTeacherId}`
      : `${API_URL}/api/teachers`;

    const method = isEdit ? "PUT" : "POST";

    const body = {
      teacher_id: teacherId,
      teacher_name: teacherName,
      nip,
      phone,
      email,
      status_active: statusActive,
      roles
    };

    const res = await fetch(url, {
      method,
      headers: getAdminHeaders(),
      body: JSON.stringify(body)
    });

    const result = await res.json();
    document.getElementById("teacherResult").innerHTML = result.message;

    if (result.success) {
      await loadTeachers();
      resetForm();
    }
  });

  document.getElementById("resetTeacherBtn").addEventListener("click", resetForm);

  await generateTeacherId();
  await loadTeachers();
}