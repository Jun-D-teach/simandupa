function getHomePage() {
  return `
    <div style="
      min-height: 100vh;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #1e40af 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: Arial, sans-serif;
    ">
      <div style="max-width: 900px; width: 100%;">
        
        <!-- Logo dan Judul -->
        <div style="text-align: center; margin-bottom: 50px;">
          <div style="
            background: white;
            width: 130px;
            height: 130px;
            border-radius: 50%;
            margin: 0 auto 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          ">
            <img src="https://man2plg.sch.id/Foto/logo.png" alt="Logo" style="
              width: 110px;
              height: 110px;
              object-fit: contain;
            " onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22https://man2plg.sch.id/Foto/logo.png viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E🏫%3C/text%3E%3C/svg%3E'">
          </div>
          
          <h1 style="
            font-size: 42px;
            font-weight: bold;
            color: white;
            margin: 0 0 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          ">Selamat Datang di Aplikasi</h1>
          
          <h2 style="
            font-size: 36px;
            font-weight: bold;
            color: #fde047;
            margin: 0 0 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          ">SIMANDUPA 2026</h2>
          
          <p style="
            font-size: 18px;
            color: #bfdbfe;
            margin: 0;
          ">Sistem Informasi Manajemen Terpadu<br>MAN 2 Palembang</p>
        </div>

        <!-- Card Menu -->
        <div style="
          background: white;
          border-radius: 20px;
          padding: 50px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        ">
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
          ">
            <!-- Card Absensi -->
            <div style="
              background: #eff6ff;
              border: 2px solid #bfdbfe;
              border-radius: 12px;
              padding: 25px;
              text-align: center;
            ">
              <div style="font-size: 50px; margin-bottom: 15px;">📱</div>
              <h3 style="
                font-size: 20px;
                font-weight: bold;
                color: #1e3a8a;
                margin: 0 0 10px;
              ">Absensi Digital</h3>
              <p style="color: #1e40af; font-size: 14px; margin: 0;">
                Absensi menggunakan QR Code untuk siswa dan guru
              </p>
            </div>

            <!-- Card Notifikasi -->
            <div style="
              background: #f0fdf4;
              border: 2px solid #bbf7d0;
              border-radius: 12px;
              padding: 25px;
              text-align: center;
            ">
              <div style="font-size: 50px; margin-bottom: 15px;"></div>
              <h3 style="
                font-size: 20px;
                font-weight: bold;
                color: #166534;
                margin: 0 0 10px;
              ">Notifikasi Otomatis</h3>
              <p style="color: #166534; font-size: 14px; margin: 0;">
                Notifikasi WhatsApp ke orang tua saat siswa absen
              </p>
            </div>
          </div>

          <!-- Tombol Login -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="/?page=login" style="
              display: inline-block;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              font-weight: bold;
              font-size: 18px;
              padding: 18px 50px;
              border-radius: 12px;
              text-decoration: none;
              box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              🔐 Login ke Sistem
            </a>
          </div>

          <!-- Info Footer -->
          <div style="
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          ">
            <p style="margin: 0 0 5px;">© 2026 MAN 2 Palembang - Kementerian Agama RI</p>
            <p style="margin: 0;">Jl. Prof. KH. Zainal Abidin Fikri, Palembang</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export { getHomePage };