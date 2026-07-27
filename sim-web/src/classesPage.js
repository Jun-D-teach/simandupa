const API_URL = "http://localhost:3000";

function getAdminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-key": localStorage.getItem("simAdminKey") || "",
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gagal memproses data");
  }

  return result;
}

export async function initClassesPage() {
  const box = document.getElementById("classesPageContent");
  if (!box) return;

  let teachers = [];

  box.innerHTML = `
    <div style="
      background:#ffffff;
      border:1px solid #e5e7eb;
      border-radius:18px;
      padding:20px;
      margin-bottom:20px;
      box-shadow:0 10px 24px rgba(15,23,42,0.06);
    ">
      <h2 style="margin:0 0 6px; color:#0f172a;">Form Data Kelas</h2>
      <p style="margin:0 0 18px; color:#64748b;">
        Tambahkan kelas dan pilih wali kelas agar data kelas terhubung dengan portal guru.
      </p>

      <div style="display:grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap:14px;">
        <div>
          <label style="display:block; margin-bottom:7px; font-weight:bold;">ID Kelas</label>
          <input id="class_id" placeholder="Contoh: 7A" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label style="display:block; margin-bottom:7px; font-weight:bold;">Nama Kelas</label>
          <input id="class_name" placeholder="Contoh: Kelas 7A" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;" />
        </div>

        <div>
          <label style="display:block; margin-bottom:7px; font-weight:bold;">Wali Kelas</label>
          <select id="wali_kelas_id" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:10px;">
            <option value="">Memuat guru...</option>
          </select>
        </div>
      </div>

      <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">
        <button id="saveClassBtn" style="padding:12px 16px; background:#2563eb; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">
          Simpan Kelas
        </button>

        <button id="resetClassBtn" style="padding:12px 16px; background:#e5e7eb; color:#111827; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">
          Reset
        </button>
      </div>
    </div>

    <div id="classResult" style="margin-bottom:14px;"></div>

    <div style="
      overflow:auto;
      border:1px solid #e5e7eb;
      border-radius:16px;
      background:white;
      box-shadow:0 10px 24px rgba(15,23,42,0.05);
    ">
      <table style="width:100%; border-collapse:collapse; min-width:760px;">
        <thead>
          <tr style="background:#0f172a; color:white;">
            <th style="padding:12px; text-align:left;">ID Kelas</th>
            <th style="padding:12px; text-align:left;">Nama Kelas</th>
            <th style="padding:12px; text-align:left;">Wali Kelas</th>
            <th style="padding:12px; text-align:left;">Aksi</th>
          </tr>
        </thead>
        <tbody id="classesTableBody">
          <tr>
            <td colspan="4" style="padding:12px;">Memuat data...</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  function renderTeacherOptions(selectedId = "") {
    const select = document.getElementById("wali_kelas_id");

    select.innerHTML = `
      <option value="">Pilih Wali Kelas</option>
      ${teachers
        .map(
          (teacher) => `
            <option value="${escapeHtml(teacher.teacher_id)}" ${teacher.teacher_id === selectedId ? "selected" : ""}>
              ${escapeHtml(teacher.teacher_name)}${teacher.nip ? ` - ${escapeHtml(teacher.nip)}` : ""}
            </option>
          `,
        )
        .join("")}
    `;
  }

  async function loadTeachers(currentClassId = "") {
    try {
      const params = new URLSearchParams();

      if (currentClassId) {
        params.set("currentClassId", currentClassId);
      }

      const result = await fetchJson(
        `${API_URL}/api/teachers/homeroom-options?${params.toString()}`,
        {
          headers: {
            "x-admin-key": localStorage.getItem("simAdminKey") || "",
          },
        },
      );

      teachers = result.data || [];
      renderTeacherOptions();
    } catch (error) {
      document.getElementById("wali_kelas_id").innerHTML = `
      <option value="">Gagal memuat wali kelas</option>
    `;
    }
  }

  function resetForm() {
    document.getElementById("class_id").value = "";
    document.getElementById("class_id").disabled = false;
    document.getElementById("class_name").value = "";
    loadTeachers();
    document.getElementById("saveClassBtn").textContent = "Simpan Kelas";
  }

  async function loadClasses() {
    const tbody = document.getElementById("classesTableBody");

    try {
      const result = await fetchJson(`${API_URL}/api/classes`, {
        headers: {
          "x-admin-key": localStorage.getItem("simAdminKey") || "",
        },
      });

      const data = result.data || [];

      if (!data.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="padding:14px; color:#64748b;">Belum ada data kelas.</td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = data
        .map(
          (item) => `
            <tr>
              <td style="padding:12px; border-bottom:1px solid #e5e7eb; font-weight:bold;">
                ${escapeHtml(item.class_id)}
              </td>

              <td style="padding:12px; border-bottom:1px solid #e5e7eb;">
                ${escapeHtml(item.class_name)}
              </td>

              <td style="padding:12px; border-bottom:1px solid #e5e7eb;">
                ${
                  item.wali_kelas_name
                    ? `<div style="font-weight:bold;">${escapeHtml(item.wali_kelas_name)}</div>
                     <div style="font-size:12px; color:#64748b;">${escapeHtml(item.wali_kelas_id || "-")}</div>`
                    : `<span style="color:#dc2626; font-weight:bold;">Belum diatur</span>`
                }
              </td>

              <td style="padding:12px; border-bottom:1px solid #e5e7eb;">
                <button
                  class="editClassBtn"
                  data-id="${escapeHtml(item.class_id)}"
                  data-name="${escapeHtml(item.class_name)}"
                  data-wali="${escapeHtml(item.wali_kelas_id || "")}"
                  style="padding:7px 11px; border:none; background:#f59e0b; color:white; border-radius:8px; cursor:pointer; font-weight:bold;"
                >
                  Edit
                </button>

                <button
                  class="deleteClassBtn"
                  data-id="${escapeHtml(item.class_id)}"
                  style="padding:7px 11px; border:none; background:#dc2626; color:white; border-radius:8px; cursor:pointer; font-weight:bold;"
                >
                  Hapus
                </button>
              </td>
            </tr>
          `,
        )
        .join("");

      document.querySelectorAll(".editClassBtn").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.getElementById("class_id").value = btn.dataset.id;
          document.getElementById("class_id").disabled = true;
          document.getElementById("class_name").value = btn.dataset.name;
          loadTeachers(btn.dataset.id).then(() => {
            renderTeacherOptions(btn.dataset.wali || "");
          });
          document.getElementById("saveClassBtn").textContent = "Update Kelas";
          document.getElementById("classResult").innerHTML = "";
        });
      });

      document.querySelectorAll(".deleteClassBtn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm(`Hapus kelas ${btn.dataset.id}?`)) return;

          try {
            const result = await fetchJson(
              `${API_URL}/api/classes/${btn.dataset.id}`,
              {
                method: "DELETE",
                headers: getAdminHeaders(),
              },
            );

            document.getElementById("classResult").innerHTML = `
              <div style="padding:12px; background:#dcfce7; color:#166534; border-radius:10px; font-weight:bold;">
                ${escapeHtml(result.message)}
              </div>
            `;

            resetForm();
            await loadClasses();
          } catch (error) {
            document.getElementById("classResult").innerHTML = `
              <div style="padding:12px; background:#fee2e2; color:#991b1b; border-radius:10px; font-weight:bold;">
                ${escapeHtml(error.message)}
              </div>
            `;
          }
        });
      });
    } catch (error) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="padding:12px; color:red;">Gagal memuat kelas.</td>
        </tr>
      `;
    }
  }

  document
    .getElementById("saveClassBtn")
    .addEventListener("click", async () => {
      const classId = document.getElementById("class_id").value.trim();
      const className = document.getElementById("class_name").value.trim();
      const waliKelasId = document.getElementById("wali_kelas_id").value;
      const isEdit = document.getElementById("class_id").disabled;

      if (!classId || !className) {
        document.getElementById("classResult").innerHTML = `
        <div style="padding:12px; background:#fee2e2; color:#991b1b; border-radius:10px; font-weight:bold;">
          ID kelas dan nama kelas wajib diisi.
        </div>
      `;
        return;
      }

      const url = isEdit
        ? `${API_URL}/api/classes/${classId}`
        : `${API_URL}/api/classes`;

      const method = isEdit ? "PUT" : "POST";

      const body = isEdit
        ? {
            class_name: className,
            wali_kelas_id: waliKelasId || null,
          }
        : {
            class_id: classId,
            class_name: className,
            wali_kelas_id: waliKelasId || null,
          };

      try {
        const result = await fetchJson(url, {
          method,
          headers: getAdminHeaders(),
          body: JSON.stringify(body),
        });

        document.getElementById("classResult").innerHTML = `
        <div style="padding:12px; background:#dcfce7; color:#166534; border-radius:10px; font-weight:bold;">
          ${escapeHtml(result.message)}
        </div>
      `;

        resetForm();
        await loadClasses();
      } catch (error) {
        document.getElementById("classResult").innerHTML = `
        <div style="padding:12px; background:#fee2e2; color:#991b1b; border-radius:10px; font-weight:bold;">
          ${escapeHtml(error.message)}
        </div>
      `;
      }
    });

  document.getElementById("resetClassBtn").addEventListener("click", () => {
    resetForm();
    document.getElementById("classResult").innerHTML = "";
  });

  await loadTeachers();
  await loadClasses();
}
