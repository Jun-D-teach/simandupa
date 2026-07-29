const API_URL = "http://localhost:3000";
const ADMIN_API_KEY = "simmandupa2026secure";
async function initLoginPage() {
  const loginBtn = document.getElementById("loginBtn");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginResult = document.getElementById("loginResult");

  if (!loginBtn) return;

  loginBtn.addEventListener("click", async () => {
    try {
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (!username || !password) {
        loginResult.innerHTML = `
          <p style="color:red; font-weight:bold;">Username dan password wajib diisi.</p>
        `;
        return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = "Login...";

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();
      console.log("LOGIN RESULT:", result);

      if (!result.success) {
        loginResult.innerHTML = `
          <p style="color:red; font-weight:bold;">${result.message}</p>
        `;
        return;
      }

        localStorage.setItem("simLogin", "true");
        localStorage.setItem("simUser", JSON.stringify(result.user));
        localStorage.setItem("simAdminKey", ADMIN_API_KEY);

      loginResult.innerHTML = `
        <p style="color:green; font-weight:bold;">Login berhasil. Mengalihkan...</p>
      `;

      setTimeout(() => {
        window.location.href = "/?page=dashboard";
      }, 800);
    } catch (error) {
      console.error("LOGIN UI ERROR:", error);
      loginResult.innerHTML = `
        <p style="color:red; font-weight:bold;">Gagal koneksi ke server.</p>
      `;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}

function isLoggedIn() {
  return localStorage.getItem("simLogin") === "true";
}

function logout() {
  localStorage.removeItem("simLogin");
  localStorage.removeItem("simUser");
  localStorage.removeItem("simAdminKey");
  window.location.href = "/?page=login";
}

export { initLoginPage, isLoggedIn, logout };
