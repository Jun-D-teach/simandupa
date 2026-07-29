import { API_URL } from "./config";

function getAdminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-key": localStorage.getItem("simAdminKey") || "",
  };
}

function setValueIfExists(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function getValueIfExists(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : undefined;
}

async function initSettingsPage() {
  const resultBox = document.getElementById("settingsResult");
  const saveBtn = document.getElementById("saveSettingsBtn");

  if (!saveBtn) return;

  try {
    const response = await fetch(`${API_URL}/api/settings`, {
      headers: {
        "x-admin-key": localStorage.getItem("simAdminKey") || "",
      },
    });

    const result = await response.json();

    if (result.success) {
      const data = result.data || {};

      setValueIfExists("school_name", data.school_name);
      setValueIfExists("school_address", data.school_address);
      setValueIfExists("school_logo_url", data.school_logo_url);
      setValueIfExists("principal_name", data.principal_name);
      setValueIfExists("principal_nip", data.principal_nip);
      setValueIfExists("default_homeroom_name", data.default_homeroom_name);
      setValueIfExists("default_homeroom_nip", data.default_homeroom_nip);
      setValueIfExists("current_semester", data.current_semester);
      setValueIfExists("current_school_year", data.current_school_year);
      
      // FIX: Memuat data field waktu saat halaman dibuka
      setValueIfExists("school_start_time", data.school_start_time);
      setValueIfExists("school_late_time", data.school_late_time);
      setValueIfExists("school_return_time", data.school_return_time);
      setValueIfExists("attendance_open_time", data.attendance_open_time);
      setValueIfExists("attendance_close_return_time", data.attendance_close_return_time);
    } else {
      resultBox.innerHTML = `<p style="color:red; font-weight:bold;">${result.message || "Gagal memuat settings."}</p>`;
    }
  } catch (error) {
    console.error("LOAD SETTINGS ERROR:", error);
    resultBox.innerHTML = `<p style="color:red; font-weight:bold;">Gagal memuat settings.</p>`;
  }

  saveBtn.addEventListener("click", async () => {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Menyimpan...";

      const payload = {};

      const school_name = getValueIfExists("school_name");
      const school_address = getValueIfExists("school_address");
      const school_logo_url = getValueIfExists("school_logo_url");
      const principal_name = getValueIfExists("principal_name");
      const principal_nip = getValueIfExists("principal_nip");
      const default_homeroom_name = getValueIfExists("default_homeroom_name");
      const default_homeroom_nip = getValueIfExists("default_homeroom_nip");
      const current_semester = getValueIfExists("current_semester");
      const current_school_year = getValueIfExists("current_school_year");
      const school_start_time = getValueIfExists("school_start_time");
      const school_late_time = getValueIfExists("school_late_time");
      const school_return_time = getValueIfExists("school_return_time");
      
      // FIX: Ambil nilai untuk attendance_open_time dan attendance_close_return_time
      const attendance_open_time = getValueIfExists("attendance_open_time");
      const attendance_close_return_time = getValueIfExists("attendance_close_return_time");

      if (school_name !== undefined) payload.school_name = school_name;
      if (school_address !== undefined) payload.school_address = school_address;
      if (school_logo_url !== undefined)
        payload.school_logo_url = school_logo_url;
      if (principal_name !== undefined) payload.principal_name = principal_name;
      if (principal_nip !== undefined) payload.principal_nip = principal_nip;
      if (default_homeroom_name !== undefined)
        payload.default_homeroom_name = default_homeroom_name;
      if (default_homeroom_nip !== undefined)
        payload.default_homeroom_nip = default_homeroom_nip;
      if (current_semester !== undefined)
        payload.current_semester = current_semester;
      if (current_school_year !== undefined)
        payload.current_school_year = current_school_year;
      if (school_start_time !== undefined)
        payload.school_start_time = school_start_time;
      if (school_late_time !== undefined)
        payload.school_late_time = school_late_time;
      if (school_return_time !== undefined)
        payload.school_return_time = school_return_time;
        
      // FIX: Masukkan ke payload jika nilainya ada (tidak undefined)
      if (attendance_open_time !== undefined)
        payload.attendance_open_time = attendance_open_time;
      if (attendance_close_return_time !== undefined)
        payload.attendance_close_return_time = attendance_close_return_time;

      const response = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        resultBox.innerHTML = `<p style="color:red; font-weight:bold;">${result.message}</p>`;
        return;
      }

      if (payload.current_semester !== undefined) {
        localStorage.setItem(
          "simCurrentSemester",
          payload.current_semester || "-",
        );
      }

      if (payload.current_school_year !== undefined) {
        localStorage.setItem(
          "simCurrentSchoolYear",
          payload.current_school_year || "-",
        );
      }

      resultBox.innerHTML = `<p style="color:green; font-weight:bold;">Settings berhasil disimpan.</p>`;
    } catch (error) {
      console.error("SAVE SETTINGS UI ERROR:", error);
      resultBox.innerHTML = `<p style="color:red; font-weight:bold;">Gagal koneksi ke server.</p>`;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan Profil Madrasah";
    }
  });
}

export { initSettingsPage };