const API_URL = "http://localhost:3000";

export function initTeacherLoginPage() {
  const btn = document.getElementById("teacherLoginBtn");
  const resultBox = document.getElementById("teacherLoginResult");

  btn?.addEventListener("click", async () => {
    const username = document.getElementById("teacherUsername").value.trim();
    const password = document.getElementById("teacherPassword").value;

    if (!username || !password) {
      resultBox.innerHTML = `<div style="color:red;">Username dan password wajib diisi</div>`;
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/teacher-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const result = await res.json();

      if (!result.success) {
        resultBox.innerHTML = `<div style="color:red;">${result.message}</div>`;
        return;
      }

      localStorage.setItem("simTeacher", JSON.stringify(result.teacher));
      window.location.href = "/?page=teacher-portal";

    } catch (err) {
      resultBox.innerHTML = `<div style="color:red;">Gagal login</div>`;
    }
  });
}