const API_URL = "http://localhost:3000";

export function initStudentLoginPage() {
  const loginBtn = document.getElementById("studentLoginBtn");
  const resultBox = document.getElementById("studentLoginResult");

  loginBtn?.addEventListener("click", async () => {
    const username = document.getElementById("studentUsername")?.value.trim();
    const password = document.getElementById("studentPassword")?.value;

    if (!username || !password) {
      resultBox.innerHTML = `<div style="color:red;">NISN dan password wajib diisi.</div>`;
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/student-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!result.success) {
        resultBox.innerHTML = `<div style="color:red;">${result.message}</div>`;
        return;
      }

      localStorage.setItem("simStudent", JSON.stringify(result.student));
      window.location.href = "/?page=student-portal";
    } catch (error) {
      resultBox.innerHTML = `<div style="color:red;">Gagal login siswa.</div>`;
    }
  });
}