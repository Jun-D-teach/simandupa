const path = require("path");

const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, ".env") });
const { processWAQueue } = require('./waWorker');

const productionEnvPath = path.join(__dirname, ".env.production");
if (fs.existsSync(productionEnvPath)) {
  require("dotenv").config({ path: productionEnvPath, override: true });
}

const bcrypt = require("bcrypt");
const { sendWhatsApp } = require("./whatsapp");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const multer = require("multer");
const XLSX = require("xlsx");
const { pool, testConnection } = require("./db");
const QRCode = require("qrcode");

const upload = multer({ storage: multer.memoryStorage() });



// PENTING: Cari folder dist frontend
function resolveClientDistPath() {
  const candidates = [
    path.join(__dirname, "dist"), // Path baru
    path.join(__dirname, "public"),
    path.join(__dirname, "client"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      console.log(`✓ Frontend ditemukan di: ${candidate}`);
      return candidate;
    }
  }

  console.log(
    "⚠ Frontend tidak ditemukan. Jalankan 'npm run build' terlebih dahulu.",
  );
  return candidates[0];
}

const clientDistPath = resolveClientDistPath();

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://192.168.20.1:3000",  // Tambah IP server
  "http://192.168.20.*:3000",     // Atau semua IP di subnet
  process.env.FRONTEND_URL,
].filter(Boolean));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ... (lanjutkan dengan kode server.js yang sudah ada)
app.use("/public", express.static(path.join(__dirname, "public")));

function getAttendanceStatus(
  timeString,
  startTime = "07:00:00",
  lateTime = "07:15:00",
) {
  const scanSeconds = parseTimeToSeconds(timeString);
  const startSeconds = parseTimeToSeconds(startTime);
  const lateSeconds = parseTimeToSeconds(lateTime);

  if (scanSeconds === null) return "hadir";

  // Jika waktu scan melebihi batas "sangat terlambat"
  if (lateSeconds !== null && scanSeconds > lateSeconds)
    return "sangat terlambat";
  // Jika waktu scan melebihi jam masuk tapi belum batas sangat terlambat
  if (startSeconds !== null && scanSeconds > startSeconds) return "terlambat";
  return "hadir";
}

function parseTimeToSeconds(value) {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const parts = raw.split(":");
  if (parts.length < 2 || parts.length > 3) return null;

  const [hStr, mStr, sStr = "0"] = parts;
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  const s = Number.parseInt(sStr, 10);

  if ([h, m, s].some((n) => Number.isNaN(n))) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;

  return h * 3600 + m * 60 + s;
}

function formatDateToYmd(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeToHms(dateObj) {
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatAttendanceId(dateObj, studentId) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  // Format: YYYYMMDD_studentId_HHMMSS (unik setiap detik)
  return `${year}${month}${day}_${studentId}_${hours}${minutes}${seconds}`;
}
async function ensureSchema() {
  const requiredStatuses = [
    "hadir",
    "terlambat",
    "sangat terlambat",
    "pulang",
    "tidak hadir",
  ];

  const [cols] = await pool.query(
    `SELECT COLUMN_TYPE
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'attendance'
        AND COLUMN_NAME = 'status'`,
  );
  const columnType = cols.length ? String(cols[0].COLUMN_TYPE) : "";
  const hasAllStatuses = requiredStatuses.every((status) =>
    columnType.includes(`'${status}'`),
  );
  if (columnType && !hasAllStatuses) {
    const enumDef = requiredStatuses.map((status) => `'${status}'`).join(",");
    await pool.query(
      `ALTER TABLE attendance MODIFY COLUMN status ENUM(${enumDef}) NOT NULL`,
    );
    console.log("Schema: enum attendance.status diperbarui");
  }

  await pool.query(
    `INSERT IGNORE INTO scanners (scanner_id, scanner_name, location, status_active)
     VALUES (?, ?, ?, 1)`,
    ["SYSTEM", "Sistem Otomatis", "Auto"],
  );

  await pool.query(
    `INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)`,
    ["absent_notify_time", "08:00"],
  );
}

//disini tempay coding wa otomatis jika tidak absen masuk, cari di kopian server js
// async function markAbsentStudentsAndNotify(nowArg) {

let lastAbsentRunDate = null;
//disini tempay coding wa otomatis jika tidak absen masuk, cari di kopian server js
//async function absentSchedulerTick() {

function excelDateToFormatted(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const day = String(parsed.d).padStart(2, "0");
    const month = String(parsed.m).padStart(2, "0");
    const year = String(parsed.y);
    return `${day}/${month}/${year}`;
  }
  return String(value).trim();
}

// ==========================================
// TAMBAHKAN FUNGSI INI DI SINI (Konversi ke WIB)
// ==========================================
function getWIBDate(dateObj = new Date()) {
  // WIB = UTC+7
  const utc = dateObj.getTime() + dateObj.getTimezoneOffset() * 60000;
  const wibTime = new Date(utc + 3600000 * 7);
  return wibTime;
}

function verifyAdminApiKey(req, res, next) {
  const apiKey = req.headers["x-admin-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "Akses ditolak. Admin key tidak ditemukan.",
    });
  }

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Admin key tidak valid.",
    });
  }

  next();
}
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "SIM Mandupa API aktif",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({
      success: true,
      message: "Server dan database normal",
      db: rows[0],
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal koneksi ke database",
      error: error.message,
    });
  }
});

app.get("/api/students/generate-id", verifyAdminApiKey, async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const [rows] = await pool.query(
      `
        SELECT student_id
        FROM students
        WHERE student_id LIKE ?
        ORDER BY student_id DESC
        LIMIT 1
        `,
      [`STD-${year}-%`],
    );

    let nextNumber = 1;

    if (rows.length > 0) {
      const lastId = rows[0].student_id;
      const lastNumber = parseInt(lastId.split("-")[2], 10);
      nextNumber = lastNumber + 1;
    }

    const newId = `STD-${year}-${String(nextNumber).padStart(4, "0")}`;

    res.json({
      success: true,
      student_id: newId,
    });
  } catch (error) {
    console.error("Generate ID error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal generate student ID",
    });
  }
});
app.post(
  "/api/students/:studentId/generate-qr",
  verifyAdminApiKey,
  async (req, res) => {
    try {
      const { studentId } = req.params;

      const [rows] = await pool.query(
        `
        SELECT student_id
        FROM students
        WHERE student_id = ?
        LIMIT 1
        `,
        [studentId],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Siswa tidak ditemukan",
        });
      }

      const qrValue = rows[0].student_id;
      const qrDataUrl = await QRCode.toDataURL(qrValue);

      await pool.query(
        `
        UPDATE students
        SET qr_code = ?
        WHERE student_id = ?
        `,
        [qrDataUrl, studentId],
      );

      res.json({
        success: true,
        message: "QR Code berhasil dibuat",
        data: {
          student_id: studentId,
          qr_code: qrDataUrl,
        },
      });
    } catch (error) {
      console.error("Generate QR student error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal membuat QR Code siswa",
        error: error.message,
      });
    }
  },
);
app.get("/api/students/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const [rows] = await pool.query(
      `
    SELECT 
      student_id,
      nis,
      nisn,
      student_name,
      gender,
      birth_place,
      birth_date,
      address,
      religion,
      class_id,
      entry_year,
      status_active,
      parent_id,
      parent_name,
      parent_phone,
      parent_email,
      parent_relation,
      username,
      qr_code,
      created_at,
      updated_at
    FROM students
    WHERE student_id = ?
    LIMIT 1
    `,
      [studentId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Siswa tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data siswa",
      error: error.message,
    });
  }
});

app.get("/api/students", verifyAdminApiKey, async (req, res) => {
  try {
    const { classId = "", keyword = "", status = "" } = req.query;

    const conditions = [];
    const values = [];

    if (classId) {
      conditions.push("class_id = ?");
      values.push(classId);
    }

    if (status) {
      conditions.push("status_active = ?");
      values.push(status);
    }

    if (keyword) {
      conditions.push(`
          (
            student_id LIKE ?
            OR nis LIKE ?
            OR nisn LIKE ?
            OR student_name LIKE ?
          )
        `);
      const likeKeyword = `%${keyword}%`;
      values.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `
        SELECT
          student_id,
          nis,
          nisn,
          student_name,
          gender,
          birth_place,
          birth_date,
          address,
          religion,
          class_id,
          entry_year,
          status_active,
          parent_id,
          parent_name,
          parent_phone,
          parent_email,
          parent_relation,
          username,
          qr_code,
          created_at,
          updated_at
        FROM students
        ${whereClause}
        ORDER BY student_name ASC
        `,
      values,
    );

    res.json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar siswa",
      error: error.message,
    });
  }
});

app.post("/api/students", verifyAdminApiKey, async (req, res) => {
  try {
    const {
      student_id,
      nis,
      nisn,
      student_name,
      gender,
      birth_place,
      birth_date,
      address,
      religion,
      class_id,
      entry_year,
      status_active,
      parent_id,
      parent_name,
      parent_phone,
      parent_email,
      parent_relation,
      username,
      password,
      qr_code,
    } = req.body;

    if (!student_id || !student_name || !class_id) {
      return res.status(400).json({
        success: false,
        message: "student_id, student_name, dan class_id wajib diisi",
      });
    }

    const [existingStudent] = await pool.query(
      `
        SELECT student_id
        FROM students
        WHERE student_id = ?
        LIMIT 1
        `,
      [student_id],
    );

    if (existingStudent.length > 0) {
      return res.status(409).json({
        success: false,
        message: "student_id sudah terdaftar",
      });
    }

    if (username) {
      const [existingUsername] = await pool.query(
        `
          SELECT student_id
          FROM students
          WHERE username = ?
          LIMIT 1
          `,
        [username],
      );

      if (existingUsername.length > 0) {
        return res.status(409).json({
          success: false,
          message: "username siswa sudah digunakan",
        });
      }
    }

    if (!nisn) {
      return res.status(400).json({
        success: false,
        message:
          "NISN wajib diisi karena akan digunakan sebagai username siswa",
      });
    }

    const defaultPassword = "default12345";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const studentUsername = nisn;

    await pool.query(
      `
        INSERT INTO students (
          student_id,
          nis,
          nisn,
          student_name,
          gender,
          birth_place,
          birth_date,
          address,
          religion,
          class_id,
          entry_year,
          status_active,
          parent_id,
          parent_name,
          parent_phone,
          parent_email,
          parent_relation,
          username,
          password,
          qr_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        student_id,
        nis || null,
        nisn || null,
        student_name,
        gender || null,
        birth_place || null,
        birth_date || null,
        address || null,
        religion || null,
        class_id,
        entry_year || null,
        status_active || "aktif",
        parent_id || null,
        parent_name || null,
        parent_phone || null,
        parent_email || null,
        parent_relation || null,
        studentUsername,
        hashedPassword,
        qr_code || null,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Data siswa berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Create student error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Data duplikat terdeteksi",
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan siswa",
      error: error.message,
    });
  }
});
app.put("/api/students/:studentId", verifyAdminApiKey, async (req, res) => {
  try {
    const { studentId } = req.params;

    const {
      nis,
      nisn,
      student_name,
      gender,
      birth_place,
      birth_date,
      address,
      religion,
      class_id,
      entry_year,
      status_active,
      parent_id,
      parent_name,
      parent_phone,
      parent_email,
      parent_relation,
      username,
      password,
      qr_code,
    } = req.body;

    if (!student_name || !class_id) {
      if (!nisn) {
        return res.status(400).json({
          success: false,
          message: "NISN wajib diisi karena digunakan sebagai username siswa",
        });
      }
      return res.status(400).json({
        success: false,
        message: "student_name dan class_id wajib diisi",
      });
    }

    const [existingStudent] = await pool.query(
      `
        SELECT student_id, username
        FROM students
        WHERE student_id = ?
        LIMIT 1
        `,
      [studentId],
    );

    if (existingStudent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Siswa tidak ditemukan",
      });
    }

    if (username) {
      const [existingUsername] = await pool.query(
        `
          SELECT student_id
          FROM students
          WHERE username = ? AND student_id <> ?
          LIMIT 1
          `,
        [username, studentId],
      );

      if (existingUsername.length > 0) {
        return res.status(409).json({
          success: false,
          message: "username siswa sudah digunakan",
        });
      }
    }

    let passwordQuery = "";
    const values = [
      nis || null,
      nisn || null,
      student_name,
      gender || null,
      birth_place || null,
      birth_date || null,
      address || null,
      religion || null,
      class_id,
      entry_year || null,
      status_active || "aktif",
      parent_id || null,
      parent_name || null,
      parent_phone || null,
      parent_email || null,
      parent_relation || null,
      nisn,
      qr_code || null,
    ];

    if (password && String(password).trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      passwordQuery = ", password = ?";
      values.push(hashedPassword);
    }

    values.push(studentId);

    await pool.query(
      `
        UPDATE students
        SET
          nis = ?,
          nisn = ?,
          student_name = ?,
          gender = ?,
          birth_place = ?,
          birth_date = ?,
          address = ?,
          religion = ?,
          class_id = ?,
          entry_year = ?,
          status_active = ?,
          parent_id = ?,
          parent_name = ?,
          parent_phone = ?,
          parent_email = ?,
          parent_relation = ?,
          username = ?,
          qr_code = ?
          ${passwordQuery}
        WHERE student_id = ?
        `,
      values,
    );

    res.json({
      success: true,
      message: "Data siswa berhasil diupdate",
    });
  } catch (error) {
    console.error("Update student error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Data duplikat terdeteksi",
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal mengupdate siswa",
      error: error.message,
    });
  }
});
app.delete("/api/students/:studentId", verifyAdminApiKey, async (req, res) => {
  try {
    const { studentId } = req.params;

    const [studentRows] = await pool.query(
      `
        SELECT student_id, student_name
        FROM students
        WHERE student_id = ?
        LIMIT 1
        `,
      [studentId],
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Siswa tidak ditemukan",
      });
    }

    const [attendanceRows] = await pool.query(
      `
        SELECT attendance_id
        FROM attendance
        WHERE student_id = ?
        LIMIT 1
        `,
      [studentId],
    );

    if (attendanceRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Siswa tidak bisa dihapus karena sudah memiliki data absensi",
      });
    }

    await pool.query(
      `
        DELETE FROM students
        WHERE student_id = ?
        `,
      [studentId],
    );

    res.json({
      success: true,
      message: "Data siswa berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus siswa",
      error: error.message,
    });
  }
});
app.get("/api/teacher/:teacherId/homeroom", async (req, res) => {
  try {
    const { teacherId } = req.params;

    const [classRows] = await pool.query(
      `
      SELECT
        class_id,
        class_name,
        wali_kelas_id
      FROM classes
      WHERE wali_kelas_id = ?
      ORDER BY class_name ASC
      `,
      [teacherId],
    );

    if (!classRows.length) {
      return res.json({
        success: true,
        classes: [],
        students: [],
      });
    }

    const classIds = classRows.map((item) => item.class_id);

    const [studentRows] = await pool.query(
      `
  SELECT
    student_id,
    nis,
    nisn,
    student_name,
    gender,
    birth_place,
    birth_date,
    address,
    religion,
    class_id,
    status_active,
    parent_id,
    parent_name,
    parent_phone,
    parent_email,
    parent_relation
  FROM students
  WHERE class_id IN (?)
    AND status_active = 'aktif'
  ORDER BY class_id ASC, student_name ASC
  `,
      [classIds],
    );

    res.json({
      success: true,
      classes: classRows,
      students: studentRows,
    });
  } catch (error) {
    console.error("GET HOMEROOM DATA ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data wali kelas",
      error: error.message,
    });
  }
});
app.get("/api/teacher/:teacherId/homeroom/attendance", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { date } = req.query;

    const selectedDate = date || new Date().toISOString().split("T")[0];

    const [classRows] = await pool.query(
      `
      SELECT class_id, class_name
      FROM classes
      WHERE wali_kelas_id = ?
      ORDER BY class_name ASC
      `,
      [teacherId],
    );

    if (!classRows.length) {
      return res.json({
        success: true,
        date: selectedDate,
        classes: [],
        summary: {
          total_students: 0,
          checked_in: 0,
          not_checked_in: 0,
          hadir: 0,
          terlambat: 0,
          sangat_terlambat: 0,
        },
        data: [],
      });
    }

    const classIds = classRows.map((item) => item.class_id);

    const [studentRows] = await pool.query(
      `
      SELECT
        student_id,
        nis,
        nisn,
        student_name,
        gender,
        class_id,
        parent_name,
        parent_phone
      FROM students
      WHERE class_id IN (?)
        AND status_active = 'aktif'
      ORDER BY class_id ASC, student_name ASC
      `,
      [classIds],
    );

    const studentIds = studentRows.map((item) => item.student_id);

    let attendanceRows = [];

    if (studentIds.length) {
      const [rows] = await pool.query(
        `
        SELECT
          student_id,
          attendance_date,
          attendance_time,
          status,
          scanner_id,
          notification_sent
        FROM attendance
        WHERE student_id IN (?)
          AND attendance_date = ?
        `,
        [studentIds, selectedDate],
      );

      attendanceRows = rows;
    }

    const attendanceMap = {};
    attendanceRows.forEach((item) => {
      attendanceMap[item.student_id] = item;
    });

    const data = studentRows.map((student) => {
      const attendance = attendanceMap[student.student_id];

      return {
        student_id: student.student_id,
        nis: student.nis,
        nisn: student.nisn,
        student_name: student.student_name,
        gender: student.gender,
        class_id: student.class_id,
        parent_name: student.parent_name,
        parent_phone: student.parent_phone,
        attendance_date: attendance ? attendance.attendance_date : selectedDate,
        attendance_time: attendance ? attendance.attendance_time : null,
        status: attendance ? attendance.status : "belum absen",
        scanner_id: attendance ? attendance.scanner_id : null,
        notification_sent: attendance ? attendance.notification_sent : 0,
      };
    });

    const summary = {
      total_students: data.length,
      checked_in: data.filter((item) => item.status !== "belum absen").length,
      not_checked_in: data.filter((item) => item.status === "belum absen")
        .length,
      hadir: data.filter((item) => item.status === "hadir").length,
      terlambat: data.filter((item) => item.status === "terlambat").length,
      sangat_terlambat: data.filter(
        (item) => item.status === "sangat terlambat",
      ).length,
    };

    res.json({
      success: true,
      date: selectedDate,
      classes: classRows,
      summary,
      data,
    });
  } catch (error) {
    console.error("GET HOMEROOM ATTENDANCE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data absensi wali kelas",
      error: error.message,
    });
  }
});
app.put(
  "/api/teacher/:teacherId/homeroom/students/:studentId",
  async (req, res) => {
    try {
      const { teacherId, studentId } = req.params;

      const {
        student_name,
        gender,
        birth_place,
        birth_date,
        address,
        religion,
        parent_id,
        parent_name,
        parent_phone,
        parent_email,
        parent_relation,
      } = req.body;

      const [studentRows] = await pool.query(
        `
      SELECT s.student_id, s.class_id
      FROM students s
      INNER JOIN classes c ON c.class_id = s.class_id
      WHERE s.student_id = ?
        AND c.wali_kelas_id = ?
      LIMIT 1
      `,
        [studentId, teacherId],
      );

      if (!studentRows.length) {
        return res.status(403).json({
          success: false,
          message: "Anda tidak berhak mengedit siswa ini",
        });
      }

      if (!student_name) {
        return res.status(400).json({
          success: false,
          message: "Nama siswa wajib diisi",
        });
      }

      await pool.query(
        `
      UPDATE students
      SET
        student_name = ?,
        gender = ?,
        birth_place = ?,
        birth_date = ?,
        address = ?,
        religion = ?,
        parent_id = ?,
        parent_name = ?,
        parent_phone = ?,
        parent_email = ?,
        parent_relation = ?
      WHERE student_id = ?
      `,
        [
          student_name,
          gender || null,
          birth_place || null,
          birth_date || null,
          address || null,
          religion || null,
          parent_id || null,
          parent_name || null,
          parent_phone || null,
          parent_email || null,
          parent_relation || null,
          studentId,
        ],
      );

      res.json({
        success: true,
        message: "Data siswa berhasil diperbarui oleh wali kelas",
      });
    } catch (error) {
      console.error("UPDATE HOMEROOM STUDENT ERROR:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui data siswa",
        error: error.message,
      });
    }
  },
);
app.post("/api/teacher-login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi",
      });
    }

    const [teacherRows] = await pool.query(
      `
      SELECT
        teacher_id,
        teacher_name,
        nip,
        phone,
        email,
        username,
        password,
        status_active
      FROM teachers
      WHERE username = ?
      LIMIT 1
      `,
      [username],
    );

    if (!teacherRows.length) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    const teacher = teacherRows[0];

    if (teacher.status_active !== "aktif") {
      return res.status(403).json({
        success: false,
        message: "Akun guru tidak aktif",
      });
    }

    const isMatch = await bcrypt.compare(password, teacher.password || "");

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    const [roleRows] = await pool.query(
      `
      SELECT role
      FROM teacher_roles
      WHERE teacher_id = ?
      ORDER BY role ASC
      `,
      [teacher.teacher_id],
    );

    res.json({
      success: true,
      message: "Login guru berhasil",
      teacher: {
        teacher_id: teacher.teacher_id,
        teacher_name: teacher.teacher_name,
        nip: teacher.nip,
        phone: teacher.phone,
        email: teacher.email,
        username: teacher.username,
        roles: roleRows.map((item) => item.role),
      },
    });
  } catch (error) {
    console.error("TEACHER LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal login guru",
      error: error.message,
    });
  }
});

app.post("/api/attendance", async (req, res) => {
  let connection;
  try {
    const { student_id, scanner_id } = req.body;
    if (!student_id || !scanner_id)
      return res.status(400).json({ success: false, message: "Data tidak lengkap" });
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // 1. Ambil Data Siswa & Pengaturan Jam
    const [[student]] = await connection.query(
      "SELECT * FROM students WHERE student_id = ? LIMIT 1",
      [student_id],
    );
    const [settingsRows] = await connection.query(
      "SELECT setting_key, setting_value FROM settings",
    );
    if (!student) throw { status: 404, message: "Siswa tidak ditemukan" };
    if (student.status_active !== "aktif")
      throw { status: 400, message: "Siswa tidak aktif" };
    
    const config = Object.fromEntries(
      settingsRows.map((s) => [s.setting_key, s.setting_value]),
    );
    
    if (!config.school_start_time || !config.school_late_time) {
      throw {
        status: 500,
        message: "Pengaturan jam masuk dan batas terlambat belum dikonfigurasi. Hubungi admin.",
      };
    }
    
    const now = getWIBDate();
    const attendanceDate = formatDateToYmd(now);
    const attendanceTime = formatTimeToHms(now);
    const attendanceSeconds = parseTimeToSeconds(attendanceTime);
    const openSeconds = parseTimeToSeconds(config.attendance_open_time);
    const returnSeconds = parseTimeToSeconds(config.school_return_time);
    const closeReturnSeconds = parseTimeToSeconds(config.attendance_close_return_time);
    const lateSeconds = parseTimeToSeconds(config.school_late_time);
    
    // Validasi window absensi
    if (attendanceSeconds !== null && openSeconds !== null && attendanceSeconds < openSeconds) {
      throw { status: 400, message: "Absensi belum dibuka" };
    }
    if (attendanceSeconds !== null && closeReturnSeconds !== null && attendanceSeconds > closeReturnSeconds) {
      throw { status: 400, message: "Absensi sudah ditutup" };
    }
    
    // 2. Tentukan Status
    let type = "masuk", status = "hadir";
    
    if (attendanceSeconds !== null && returnSeconds !== null && attendanceSeconds >= returnSeconds) {
      if (closeReturnSeconds !== null && attendanceSeconds > closeReturnSeconds) {
        throw { status: 400, message: "Batas akhir absen pulang sudah lewat" };
      }
      type = "pulang";
      status = "pulang";
    } else {
      if (attendanceSeconds !== null && lateSeconds !== null && attendanceSeconds > lateSeconds) {
        throw {
          status: 400,
          message: `Batas terlambat (${config.school_late_time}) sudah lewat. Siswa tidak bisa absen lagi.`,
        };
      }
      status = getAttendanceStatus(attendanceTime, config.school_start_time, config.school_late_time);
    }
    
    // 3. Cek Duplikasi
    const [existingSameStatus] = await connection.query(
      "SELECT attendance_id FROM attendance WHERE student_id = ? AND attendance_date = ? AND status = ?",
      [student_id, attendanceDate, status],
    );
    if (existingSameStatus.length > 0) {
      throw { status: 409, message: `Siswa sudah absen dengan status '${status}' hari ini` };
    }
    
    const [todayAttendance] = await connection.query(
      "SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND attendance_date = ?",
      [student_id, attendanceDate],
    );
    if (todayAttendance[0].count >= 2) {
      throw { status: 409, message: "Siswa sudah absen maksimal (hadir & pulang) hari ini" };
    }
    
    // 4. Simpan ke Database
    const attendanceId = formatAttendanceId(now, student_id);
    await connection.query(
      "INSERT INTO attendance (attendance_id, student_id, student_name, class_id, attendance_date, attendance_time, status, scanner_id, notification_sent) VALUES (?,?,?,?,?,?,?,?,0)",
      [attendanceId, student.student_id, student.student_name, student.class_id, attendanceDate, attendanceTime, status, scanner_id],
    );
    
    // 5. Simpan ke WA Queue (bukan langsung kirim)
    if (student.parent_phone) {
      const message = `Ananda ${student.student_name} (${student.class_id}) telah absen ${type} pada ${attendanceTime}. Status: ${status}.`;
      await connection.query(
        "INSERT INTO wa_queue (phone, message, attendance_id, status, created_at) VALUES (?, ?, ?, 'pending', NOW())",
        [student.parent_phone, message, attendanceId]
      );
    }
    
    await connection.commit();
    
    // ✅✅✅ HANYA ADA 1 res.json() DI SINI (di akhir) ✅✅✅
    res.json({
      success: true,
      message: "Absensi berhasil",
      data: {
        attendance_id: attendanceId,
        student_name: student.student_name,
        class_id: student.class_id,
        attendance_date: attendanceDate,
        attendance_time: attendanceTime,
        status: status,
        scanner_id: scanner_id,
      },
    });
    
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(error.status || 500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});
app.get("/api/admin-key", (req, res) => {
  res.json({ admin_key: process.env.ADMIN_API_KEY || "" });
});
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi",
      });
    }

    const [rows] = await pool.query(
      `
        SELECT id, username, password, full_name, role, status_active
        FROM users
        WHERE username = ?
        LIMIT 1
        `,
      [username],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    const user = rows[0];

    if (!user.status_active) {
      return res.status(403).json({
        success: false,
        message: "Akun tidak aktif",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    // Hanya untuk admin / role tertentu
    const isAdmin = user.role === "admin" || user.role === "superadmin";

    res.json({
      success: true,
      message: "Login berhasil",
      admin_key: isAdmin ? process.env.ADMIN_API_KEY || "" : "",
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal login",
      error: error.message,
    });
  }
});
app.post("/api/student-login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "NISN dan password wajib diisi",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        student_id,
        nis,
        nisn,
        student_name,
        username,
        password,
        class_id,
        status_active,
        qr_code
      FROM students
      WHERE username = ?
      LIMIT 1
      `,
      [username],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "NISN atau password salah",
      });
    }

    const student = rows[0];

    if (student.status_active !== "aktif") {
      return res.status(403).json({
        success: false,
        message: "Akun siswa tidak aktif",
      });
    }

    const isMatch = await bcrypt.compare(password, student.password || "");

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "NISN atau password salah",
      });
    }

    res.json({
      success: true,
      message: "Login siswa berhasil",
      student: {
        student_id: student.student_id,
        nis: student.nis,
        nisn: student.nisn,
        student_name: student.student_name,
        class_id: student.class_id,
        qr_code: student.qr_code,
      },
    });
  } catch (error) {
    console.error("STUDENT LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal login siswa",
      error: error.message,
    });
  }
});
app.post("/api/student/change-password", async (req, res) => {
  try {
    const { student_id, old_password, new_password } = req.body;

    if (!student_id || !old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Data password belum lengkap",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 6 karakter",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT student_id, password
      FROM students
      WHERE student_id = ?
      LIMIT 1
      `,
      [student_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Siswa tidak ditemukan",
      });
    }

    const student = rows[0];

    const isMatch = await bcrypt.compare(old_password, student.password || "");

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password lama salah",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      `
      UPDATE students
      SET password = ?
      WHERE student_id = ?
      `,
      [hashedPassword, student_id],
    );

    res.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("CHANGE STUDENT PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengubah password",
      error: error.message,
    });
  }
});
app.get("/api/student/:studentId/attendance", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    const now = new Date();
    const selectedMonth = Number(month || now.getMonth() + 1);
    const selectedYear = Number(year || now.getFullYear());

    const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const monthEnd = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const [rows] = await pool.query(
      `
      SELECT
        attendance_id,
        attendance_date,
        attendance_time,
        status,
        scanner_id,
        notification_sent,
        created_at
      FROM attendance
      WHERE student_id = ?
        AND attendance_date BETWEEN ? AND ?
      ORDER BY attendance_date DESC, attendance_time DESC
      `,
      [studentId, monthStart, monthEnd],
    );

    res.json({
      success: true,
      filter: {
        month: selectedMonth,
        year: selectedYear,
      },
      data: rows,
    });
  } catch (error) {
    console.error("GET STUDENT ATTENDANCE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat absensi siswa",
      error: error.message,
    });
  }
});

app.get("/api/dashboard", verifyAdminApiKey, async (req, res) => {
  try {
    const { date, classId, status } = req.query;
    const conditions = [];
    const values = [];
    if (date) {
      conditions.push("a.attendance_date = ?");
      values.push(date);
    }
    if (classId) {
      conditions.push("a.class_id = ?");
      values.push(classId);
    }
    if (status) {
      conditions.push("a.status = ?");
      values.push(status);
    }
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `
        SELECT
          a.attendance_id,
          a.student_id,
          a.student_name,
          a.class_id,
          a.attendance_date,
          a.attendance_time,
          a.status,
          a.scanner_id,
          a.notification_sent,
          a.created_at,
          t.teacher_name AS scanner_name
        FROM attendance a
        LEFT JOIN teachers t ON t.teacher_id = a.scanner_id
        ${whereClause}
        ORDER BY a.attendance_date DESC, a.attendance_time DESC
        `,
      values,
    );
    const summary = {
      total: rows.length,
      hadir: rows.filter((item) => item.status === "hadir").length,
      terlambat: rows.filter((item) => item.status === "terlambat").length,
      sangat_terlambat: rows.filter(
        (item) => item.status === "sangat terlambat",
      ).length,
    };
    res.json({
      success: true,
      summary,
      data: rows,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data dashboard",
      error: error.message,
    });
  }
});

app.post(
  "/api/import/students",
  verifyAdminApiKey,
  upload.single("file"),
  async (req, res) => {
    let connection;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File Excel wajib diupload",
        });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, {
        raw: true,
        defval: "",
      });

      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: "File kosong",
        });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      let inserted = 0;

      for (const row of data) {
        const student_id = String(row.student_id || "").trim();
        const nis = String(row.nis || "").trim();
        const nisn = String(row.nisn || "").trim();
        const student_name = String(row.student_name || "").trim();
        const gender = String(row.gender || "").trim();
        const birth_place = String(row.birth_place || "").trim();
        const birth_date = excelDateToFormatted(row.birth_date);
        const address = String(row.address || "").trim();
        const religion = String(row.religion || "").trim();
        const class_id = String(row.class_id || "").trim();
        const entry_year = String(row.entry_year || "").trim();
        const status_active = String(row.status_active || "aktif").trim();
        const parent_id = String(row.parent_id || "").trim();
        const parent_name = String(row.parent_name || "").trim();
        const parent_phone = String(row.parent_phone || "").trim();
        const parent_email = String(row.parent_email || "").trim();
        const parent_relation = String(row.parent_relation || "").trim();

        if (!student_id || !student_name || !class_id) {
          continue;
        }

        const [classCheck] = await connection.query(
          "SELECT class_id FROM classes WHERE class_id = ? LIMIT 1",
          [class_id],
        );

        if (classCheck.length === 0) {
          await connection.query(
            "INSERT INTO classes (class_id, class_name) VALUES (?, ?)",
            [class_id, class_id],
          );
        }

        await connection.query(
          `
          INSERT INTO students (
            student_id, nis, nisn, student_name, gender,
            birth_place, birth_date, address, religion,
            class_id, entry_year, status_active,
            parent_id, parent_name, parent_phone,
            parent_email, parent_relation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            nis = VALUES(nis),
            nisn = VALUES(nisn),
            student_name = VALUES(student_name),
            gender = VALUES(gender),
            birth_place = VALUES(birth_place),
            birth_date = VALUES(birth_date),
            address = VALUES(address),
            religion = VALUES(religion),
            class_id = VALUES(class_id),
            entry_year = VALUES(entry_year),
            status_active = VALUES(status_active),
            parent_id = VALUES(parent_id),
            parent_name = VALUES(parent_name),
            parent_phone = VALUES(parent_phone),
            parent_email = VALUES(parent_email),
            parent_relation = VALUES(parent_relation)
          `,
          [
            student_id,
            nis || null,
            nisn || null,
            student_name,
            gender || null,
            birth_place || null,
            birth_date || null,
            address || null,
            religion || null,
            class_id,
            entry_year || null,
            status_active || "aktif",
            parent_id || null,
            parent_name || null,
            parent_phone || null,
            parent_email || null,
            parent_relation || null,
          ],
        );

        inserted++;
      }

      await connection.commit();

      res.json({
        success: true,
        message: "Import berhasil",
        total: inserted,
      });
    } catch (error) {
      if (connection) await connection.rollback();

      console.error("IMPORT ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Gagal import Excel",
        error: error.message,
      });
    } finally {
      if (connection) connection.release();
    }
  },
);
app.post(
  "/api/import/teachers",
  verifyAdminApiKey,
  upload.single("file"),
  async (req, res) => {
    let connection;
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File Excel wajib diupload",
        });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, {
        raw: true,
        defval: "",
      });

      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: "File kosong",
        });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      let inserted = 0;
      let skipped = 0;
      let errors = [];

      for (const row of data) {
        try {
          const teacher_id = String(row.teacher_id || "").trim();
          const teacher_name = String(row.teacher_name || "").trim();
          const nip = String(row.nip || "").trim();
          const phone = String(row.phone || "").trim();
          const email = String(row.email || "").trim();
          const status_active = String(row.status_active || "aktif").trim();
          const roles = String(row.roles || "guru")
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r);

          // Validasi data wajib
          if (!teacher_id || !teacher_name) {
            errors.push({
              row: data.indexOf(row) + 1,
              message: "teacher_id dan teacher_name wajib diisi",
            });
            skipped++;
            continue;
          }

          // Username dari NIP atau email
          const username = nip || email;
          if (!username) {
            errors.push({
              row: data.indexOf(row) + 1,
              message: "NIP atau email wajib diisi untuk username",
            });
            skipped++;
            continue;
          }

          if (existingTeacher.length > 0) {
            // Update guru yang sudah ada
            const defaultPassword = "default12345";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            await connection.query(
              `
              UPDATE teachers
              SET
                teacher_name = ?,
                nip = ?,
                phone = ?,
                email = ?,
                username = ?,
                status_active = ?,
                password = COALESCE(password, ?),
                updated_at = CURRENT_TIMESTAMP
              WHERE teacher_id = ?
              `,
              [
                teacher_name,
                nip || null,
                phone || null,
                email || null,
                username,
                status_active || "aktif",
                hashedPassword,
                teacher_id,
              ],
            );

            // Update roles
            await connection.query(
              "DELETE FROM teacher_roles WHERE teacher_id = ?",
              [teacher_id],
            );
          } else {
            // Insert guru baru
            const defaultPassword = "default12345";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            await connection.query(
              `
              INSERT INTO teachers (
                teacher_id,
                teacher_name,
                nip,
                phone,
                email,
                username,
                password,
                status_active
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                teacher_id,
                teacher_name,
                nip || null,
                phone || null,
                email || null,
                username,
                hashedPassword,
                status_active || "aktif",
              ],
            );
          }

          // Insert roles
          const selectedRoles = roles.length ? roles : ["guru"];
          if (!selectedRoles.includes("guru")) {
            selectedRoles.unshift("guru");
          }

          for (const role of selectedRoles) {
            await connection.query(
              `
              INSERT INTO teacher_roles (teacher_id, role)
              VALUES (?, ?)
              ON DUPLICATE KEY UPDATE role = VALUES(role)
              `,
              [teacher_id, role],
            );
          }

          inserted++;
        } catch (rowError) {
          console.error("Error processing row:", rowError);
          errors.push({
            row: data.indexOf(row) + 1,
            message: rowError.message,
          });
          skipped++;
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: "Import guru berhasil",
        total: data.length,
        inserted,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("IMPORT TEACHERS ERROR:", error);
      res.status(500).json({
        success: false,
        message: "Gagal import data guru",
        error: error.message,
      });
    } finally {
      if (connection) connection.release();
    }
  },
);
// Di server.js - tambahkan endpoint ini

// Download template Excel untuk import guru
app.get("/api/templates/teachers", async (req, res) => {
  try {
    // Optional: cek admin key (sesuaikan dengan cara Anda)
    const adminKey = req.headers["x-admin-key"];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Teachers");

    // Definisi kolom
    worksheet.columns = [
      { header: "teacher_id", key: "teacher_id", width: 15 },
      { header: "teacher_name", key: "teacher_name", width: 30 },
      { header: "nip", key: "nip", width: 20 },
      { header: "email", key: "email", width: 30 },
      { header: "phone", key: "phone", width: 15 },
      { header: "status_active", key: "status_active", width: 15 },
      { header: "roles", key: "roles", width: 20 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };

    // Tambahkan contoh data
    worksheet.addRow({
      teacher_id: "GURU001",
      teacher_name: "Contoh Nama Guru",
      nip: "199001012020011001",
      email: "guru@man2palembang.sch.id",
      phone: "08123456789",
      status_active: "1",
      roles: "guru,wali_kelas",
    });

    // Tambahkan baris kosong untuk diisi user
    for (let i = 0; i < 10; i++) {
      worksheet.addRow({});
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template_import_guru.xlsx",
    );
    res.send(buffer);
  } catch (error) {
    console.error("Generate template guru error:", error);
    res.status(500).json({ success: false, message: "Gagal membuat template" });
  }
});
app.get("/api/classes", verifyAdminApiKey, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        c.class_id,
        c.class_name,
        c.wali_kelas_id,
        t.teacher_name AS wali_kelas_name,
        t.nip AS wali_kelas_nip
      FROM classes c
      LEFT JOIN teachers t ON t.teacher_id = c.wali_kelas_id
      ORDER BY c.class_name ASC
      `,
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Classes error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data kelas",
      error: error.message,
    });
  }
});

app.get("/api/classes/:classId", verifyAdminApiKey, async (req, res) => {
  try {
    const { classId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        c.class_id,
        c.class_name,
        c.wali_kelas_id,
        t.teacher_name AS wali_kelas_name,
        t.nip AS wali_kelas_nip
      FROM classes c
      LEFT JOIN teachers t ON t.teacher_id = c.wali_kelas_id
      WHERE c.class_id = ?
      LIMIT 1
      `,
      [classId],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Kelas tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("GET CLASS DETAIL ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail kelas",
    });
  }
});
app.get(
  "/api/teachers/homeroom-options",
  verifyAdminApiKey,
  async (req, res) => {
    try {
      const { currentClassId = "" } = req.query;

      const values = [];

      let currentClassCondition = "";

      if (currentClassId) {
        currentClassCondition = "OR c.class_id = ?";
        values.push(currentClassId);
      }

      const [rows] = await pool.query(
        `
      SELECT DISTINCT
        t.teacher_id,
        t.teacher_name,
        t.nip
      FROM teachers t
      INNER JOIN teacher_roles tr ON tr.teacher_id = t.teacher_id
      LEFT JOIN classes c ON c.wali_kelas_id = t.teacher_id
      WHERE tr.role = 'wali_kelas'
        AND t.status_active = 'aktif'
        AND (
          c.class_id IS NULL
          ${currentClassCondition}
        )
      ORDER BY t.teacher_name ASC
      `,
        values,
      );

      res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error("GET HOMEROOM TEACHER OPTIONS ERROR:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar wali kelas",
        error: error.message,
      });
    }
  },
);
app.post("/api/classes", verifyAdminApiKey, async (req, res) => {
  try {
    const { class_id, class_name, wali_kelas_id } = req.body;

    if (!class_id || !class_name) {
      return res.status(400).json({
        success: false,
        message: "class_id dan class_name wajib diisi",
      });
    }

    await pool.query(
      `
      INSERT INTO classes (
        class_id,
        class_name,
        wali_kelas_id
      ) VALUES (?, ?, ?)
      `,
      [class_id, class_name, wali_kelas_id || null],
    );

    res.json({
      success: true,
      message: "Kelas berhasil ditambahkan",
    });
  } catch (error) {
    console.error("CREATE CLASS ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "class_id sudah digunakan",
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan kelas",
    });
  }
});

app.put("/api/classes/:classId", verifyAdminApiKey, async (req, res) => {
  try {
    const { classId } = req.params;
    const { class_name, wali_kelas_id } = req.body;

    if (!class_name) {
      return res.status(400).json({
        success: false,
        message: "class_name wajib diisi",
      });
    }

    await pool.query(
      `
      UPDATE classes
      SET
        class_name = ?,
        wali_kelas_id = ?
      WHERE class_id = ?
      `,
      [class_name, wali_kelas_id || null, classId],
    );

    res.json({
      success: true,
      message: "Kelas berhasil diupdate",
    });
  } catch (error) {
    console.error("UPDATE CLASS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal update kelas",
    });
  }
});
app.delete("/api/classes/:classId", verifyAdminApiKey, async (req, res) => {
  try {
    const { classId } = req.params;

    await pool.query(`DELETE FROM classes WHERE class_id = ?`, [classId]);

    res.json({
      success: true,
      message: "Kelas berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE CLASS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus kelas",
    });
  }
});
app.get("/api/teachers/generate-id", verifyAdminApiKey, async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const [rows] = await pool.query(
      `
      SELECT teacher_id
      FROM teachers
      WHERE teacher_id LIKE ?
      ORDER BY teacher_id DESC
      LIMIT 1
      `,
      [`TCH-${year}-%`],
    );

    let nextNumber = 1;

    if (rows.length > 0) {
      const lastNumber = parseInt(rows[0].teacher_id.split("-")[2], 10);
      nextNumber = lastNumber + 1;
    }

    res.json({
      success: true,
      teacher_id: `TCH-${year}-${String(nextNumber).padStart(4, "0")}`,
    });
  } catch (error) {
    console.error("GENERATE TEACHER ID ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal generate ID guru",
    });
  }
});

app.get("/api/teachers", verifyAdminApiKey, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        t.teacher_id,
        t.teacher_name,
        t.nip,
        t.phone,
        t.email,
        t.username,
        t.status_active,
        t.created_at,
        t.updated_at,
        GROUP_CONCAT(tr.role ORDER BY tr.role SEPARATOR ',') AS roles
      FROM teachers t
      LEFT JOIN teacher_roles tr ON tr.teacher_id = t.teacher_id
      GROUP BY t.teacher_id
      ORDER BY t.teacher_name ASC
      `,
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET TEACHERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data guru",
    });
  }
});

app.get("/api/teachers/:teacherId", verifyAdminApiKey, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const [teacherRows] = await pool.query(
      `
      SELECT
        teacher_id,
        teacher_name,
        nip,
        phone,
        email,
        username,
        status_active,
        created_at,
        updated_at
      FROM teachers
      WHERE teacher_id = ?
      LIMIT 1
      `,
      [teacherId],
    );

    if (!teacherRows.length) {
      return res.status(404).json({
        success: false,
        message: "Guru tidak ditemukan",
      });
    }

    const [roleRows] = await pool.query(
      `
      SELECT role
      FROM teacher_roles
      WHERE teacher_id = ?
      ORDER BY role ASC
      `,
      [teacherId],
    );

    res.json({
      success: true,
      data: {
        ...teacherRows[0],
        roles: roleRows.map((item) => item.role),
      },
    });
  } catch (error) {
    console.error("GET TEACHER DETAIL ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail guru",
    });
  }
});

app.post("/api/teachers", verifyAdminApiKey, async (req, res) => {
  let connection;

  try {
    const {
      teacher_id,
      teacher_name,
      nip,
      phone,
      email,
      status_active,
      roles,
    } = req.body;

    if (!teacher_id || !teacher_name) {
      return res.status(400).json({
        success: false,
        message: "teacher_id dan teacher_name wajib diisi",
      });
    }

    if (!nip && !email) {
      return res.status(400).json({
        success: false,
        message: "NIP atau email wajib diisi untuk username login guru",
      });
    }

    const username = nip || email;
    const defaultPassword = "default12345";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const selectedRoles =
      Array.isArray(roles) && roles.length ? roles : ["guru"];

    if (!selectedRoles.includes("guru")) {
      selectedRoles.unshift("guru");
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      `
      INSERT INTO teachers (
        teacher_id,
        teacher_name,
        nip,
        phone,
        email,
        username,
        password,
        status_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        teacher_id,
        teacher_name,
        nip || null,
        phone || null,
        email || null,
        username,
        hashedPassword,
        status_active || "aktif",
      ],
    );

    for (const role of selectedRoles) {
      await connection.query(
        `
        INSERT INTO teacher_roles (teacher_id, role)
        VALUES (?, ?)
        `,
        [teacher_id, role],
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Guru berhasil ditambahkan",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("CREATE TEACHER ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Data guru / username / role duplikat",
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan guru",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});
app.put("/api/teachers/:teacherId", verifyAdminApiKey, async (req, res) => {
  let connection;

  try {
    const { teacherId } = req.params;

    const { teacher_name, nip, phone, email, status_active, roles } = req.body;

    if (!teacher_name) {
      return res.status(400).json({
        success: false,
        message: "Nama guru wajib diisi",
      });
    }

    if (!nip && !email) {
      return res.status(400).json({
        success: false,
        message: "NIP atau email wajib diisi untuk username login guru",
      });
    }

    const username = nip || email;

    const selectedRoles =
      Array.isArray(roles) && roles.length ? roles : ["guru"];

    if (!selectedRoles.includes("guru")) {
      selectedRoles.unshift("guru");
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `
      SELECT teacher_id
      FROM teachers
      WHERE teacher_id = ?
      LIMIT 1
      `,
      [teacherId],
    );

    if (!existingRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Guru tidak ditemukan",
      });
    }

    await connection.query(
      `
      UPDATE teachers
      SET
        teacher_name = ?,
        nip = ?,
        phone = ?,
        email = ?,
        username = ?,
        status_active = ?
      WHERE teacher_id = ?
      `,
      [
        teacher_name,
        nip || null,
        phone || null,
        email || null,
        username,
        status_active || "aktif",
        teacherId,
      ],
    );

    await connection.query(
      `
      DELETE FROM teacher_roles
      WHERE teacher_id = ?
      `,
      [teacherId],
    );

    for (const role of selectedRoles) {
      await connection.query(
        `
        INSERT INTO teacher_roles (teacher_id, role)
        VALUES (?, ?)
        `,
        [teacherId, role],
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Guru berhasil diupdate",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("UPDATE TEACHER ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Username atau role guru duplikat",
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal update guru",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});
app.delete("/api/teachers/:teacherId", verifyAdminApiKey, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT teacher_id
      FROM teachers
      WHERE teacher_id = ?
      LIMIT 1
      `,
      [teacherId],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Guru tidak ditemukan",
      });
    }

    await pool.query(
      `
      DELETE FROM teachers
      WHERE teacher_id = ?
      `,
      [teacherId],
    );

    res.json({
      success: true,
      message: "Guru berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE TEACHER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus guru",
      error: error.message,
    });
  }
});

app.get("/api/settings", verifyAdminApiKey, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT setting_key, setting_value
        FROM settings
        ORDER BY setting_key ASC
        `,
    );

    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil settings",
      error: error.message,
    });
  }
});

app.post("/api/settings", verifyAdminApiKey, async (req, res) => {
  let connection;

  try {
    const payload = req.body || {};

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const [key, value] of Object.entries(payload)) {
      await connection.query(
        `
          INSERT INTO settings (setting_key, setting_value)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value)
          `,
        [key, value ?? ""],
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Settings berhasil disimpan",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("SAVE SETTINGS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan settings",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});
app.post("/api/attendance/mark-absent", verifyAdminApiKey, async (req, res) => {
  try {
    const result = await markAbsentStudentsAndNotify();
    res.json({
      success: true,
      message: `Selesai. ${result.processed} siswa ditandai tidak hadir, ${result.notified} WA terkirim.`,
      data: result,
    });
  } catch (error) {
    console.error("MARK ABSENT API ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menandai siswa tidak hadir",
      error: error.message,
    });
  }
});

//app.get("/api/export/report", verifyAdminApiKey, async (req, res) => {
app.get("/api/export/report", async (req, res) => {
  try {
    const {
      classId = "",
      month = "",
      year = "",
      waliKelas = "Dra. Hj. Hajidah, M.Si",
      nipWaliKelas = "196808081994032008",
      kepalaMadrasah = "Drs. Iskandar, M.Si",
      nipKepalaMadrasah = "196605012005011005",
      semester = "Ganjil",
      tahunPelajaran = "2026/2027",
      tempat = "Palembang",
      tanggalCetak = "",
    } = req.query;

    if (!classId) {
      return res.status(400).send("classId wajib diisi");
    }

    if (!month) {
      return res.status(400).send("month wajib diisi");
    }

    if (!year) {
      return res.status(400).send("year wajib diisi");
    }

    const monthNumber = Number(month);
    const yearNumber = Number(year);

    if (
      Number.isNaN(monthNumber) ||
      Number.isNaN(yearNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return res.status(400).send("month atau year tidak valid");
    }

    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const monthName = monthNames[monthNumber - 1];
    const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

    const monthStart = `${yearNumber}-${String(monthNumber).padStart(2, "0")}-01`;
    const monthEnd = `${yearNumber}-${String(monthNumber).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const [students] = await pool.query(
      `
        SELECT
          student_id,
          nis,
          nisn,
          student_name,
          gender,
          class_id
        FROM students
        WHERE class_id = ? AND status_active = 'aktif'
        ORDER BY student_name ASC
        `,
      [classId],
    );

    const [attendanceRows] = await pool.query(
      `
        SELECT
          student_id,
          attendance_date,
          status
        FROM attendance
        WHERE class_id = ?
          AND attendance_date BETWEEN ? AND ?
        ORDER BY attendance_date ASC
        `,
      [classId, monthStart, monthEnd],
    );

    const attendanceMap = {};

    attendanceRows.forEach((row) => {
      const day = new Date(row.attendance_date).getDate();

      if (!attendanceMap[row.student_id]) {
        attendanceMap[row.student_id] = {};
      }

      attendanceMap[row.student_id][day] = row.status;
    });

    const rows = students.map((student, index) => {
      const dailyAttendance = {};
      let totalHadir = 0;
      let totalTerlambat = 0;
      let totalSangatTerlambat = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const status =
          attendanceMap[student.student_id] &&
          attendanceMap[student.student_id][day]
            ? attendanceMap[student.student_id][day]
            : "";

        let symbol = "";

        if (status === "hadir") {
          symbol = "H";
          totalHadir++;
        } else if (status === "terlambat") {
          symbol = "T";
          totalTerlambat++;
        } else if (status === "sangat terlambat") {
          symbol = "ST";
          totalSangatTerlambat++;
        }

        dailyAttendance[day] = symbol;
      }

      return {
        no: index + 1,
        nis: student.nis || "",
        nisn: student.nisn || "",
        student_name: student.student_name || "",
        gender: student.gender || "",
        dailyAttendance,
        totalHadir,
        totalTerlambat,
        totalSangatTerlambat,
      };
    });

    const safeTanggalCetak =
      tanggalCetak ||
      new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

    const dayHeadersHtml = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `<th class="center day-col">${day}</th>`;
    }).join("");

    const tableRowsHtml = rows
      .map((row) => {
        const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return `<td class="center day-col">${row.dailyAttendance[day] || ""}</td>`;
        }).join("");

        return `
          <tr>
            <td class="center sticky-col-1">${row.no}</td>
            <td class="center sticky-col-2">${row.nis}</td>
            <td class="center sticky-col-3">${row.nisn}</td>
            <td class="sticky-col-4">${row.student_name}</td>
            <td class="center sticky-col-5">${row.gender}</td>
            ${dayCells}
            <td class="center total-hadir">${row.totalHadir}</td>
            <td class="center total-terlambat">${row.totalTerlambat}</td>
            <td class="center total-sangat-terlambat">${row.totalSangatTerlambat}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Rekap Absensi ${classId} - ${monthName} ${year}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              background: #f3f4f6;
              margin: 0;
              padding: 24px;
              color: #111827;
            }

            .page {
              max-width: 1600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 18px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.08);
              padding: 32px;
            }

            .print-bar {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 18px;
            }

            .print-btn {
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 10px;
              padding: 10px 16px;
              cursor: pointer;
              font-weight: bold;
            }

            .kop {
              display: flex;
              align-items: center;
              gap: 18px;
              border-bottom: 3px solid #111827;
              padding-bottom: 18px;
              margin-bottom: 24px;
            }

            .logo {
              width: 78px;
              height: 78px;
              flex-shrink: 0;
            }

            .logo img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            .kop-text h1 {
              margin: 0;
              font-size: 28px;
              letter-spacing: 0.5px;
            }

            .kop-text h2 {
              margin: 6px 0 0;
              font-size: 18px;
              font-weight: 600;
              color: #374151;
            }

            .kop-text p {
              margin: 6px 0 0;
              color: #6b7280;
              font-size: 14px;
            }

            .title-box {
              margin: 18px 0 24px;
              padding: 16px 20px;
              border-radius: 14px;
              background: linear-gradient(135deg, #eff6ff, #ecfdf5);
              border: 1px solid #dbeafe;
            }

            .title-box h3 {
              margin: 0 0 8px;
              font-size: 22px;
            }

            .meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(260px, 1fr));
              gap: 10px 20px;
              margin-bottom: 22px;
            }

            .meta-item {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 12px 14px;
              font-size: 14px;
            }

            .meta-item b {
              display: inline-block;
              min-width: 130px;
            }

            .table-wrap {
              overflow-x: auto;
              border: 1px solid #d1d5db;
              border-radius: 14px;
            }

            table {
              width: max-content;
              min-width: 100%;
              border-collapse: collapse;
            }

            thead th {
              background: #111827;
              color: white;
              padding: 10px 8px;
              font-size: 13px;
              text-align: center;
              border: 1px solid #374151;
              white-space: nowrap;
            }

            tbody td {
              border: 1px solid #d1d5db;
              padding: 8px 8px;
              font-size: 13px;
              white-space: nowrap;
            }

            tbody tr:nth-child(even) {
              background: #f9fafb;
            }

            .center {
              text-align: center;
            }

          .day-col {
    min-width: 26px;
    width: 26px;
  }

            .total-hadir,
            .total-terlambat,
            .total-sangat-terlambat {
              font-weight: bold;
            }

            .sticky-col-1 { min-width: 52px; }
            .sticky-col-2 { min-width: 90px; }
            .sticky-col-3 { min-width: 110px; }
            .sticky-col-4 { min-width: 220px; }
            .sticky-col-5 { min-width: 90px; }

            .legend {
              display: flex;
              gap: 18px;
              flex-wrap: wrap;
              margin-top: 16px;
              font-size: 14px;
            }

            .legend span {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 999px;
              padding: 8px 12px;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 14px;
              margin-top: 22px;
            }

            .summary-card {
              border-radius: 14px;
              padding: 16px;
              color: white;
              text-align: center;
              font-weight: bold;
            }

            .hadir {
              background: linear-gradient(135deg, #16a34a, #22c55e);
            }

            .terlambat {
              background: linear-gradient(135deg, #d97706, #f59e0b);
            }

            .sangat-terlambat {
              background: linear-gradient(135deg, #dc2626, #ef4444);
            }

            .ttd {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              gap: 40px;
            }

            .ttd-box {
              width: 280px;
              text-align: center;
              font-size: 14px;
            }

            .ttd-space {
              height: 70px;
            }
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  @media print {
    html, body {
      width: 100%;
      height: auto;
      background: white;
      padding: 0;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      .logo {
    width: 52px;
    height: 52px;
  }

  .logo img {
    width: 100%;
    height: 100%;
  }
    }

    body {
      font-size: 9px;
    }

    .page {
      box-shadow: none;
      border-radius: 0;
      max-width: 100%;
      width: 100%;
      padding: 0;
      margin: 0;
    }

    .print-bar {
      display: none;
    }

    .kop {
      margin-bottom: 12px;
      padding-bottom: 10px;
    }

    .logo {
      width: 52px;
      height: 52px;
      font-size: 18px;
      border-radius: 8px;
    }

    .kop-text h1 {
      font-size: 18px;
    }

    .kop-text h2 {
      font-size: 12px;
    }

    .kop-text p {
      font-size: 10px;
    }

    .title-box {
      margin: 10px 0 12px;
      padding: 10px 12px;
    }

    .title-box h3 {
      font-size: 15px;
      margin-bottom: 4px;
    }

    .meta {
      gap: 6px 10px;
      margin-bottom: 12px;
    }

    .meta-item {
      padding: 8px 10px;
      font-size: 10px;
      border-radius: 8px;
    }

    .table-wrap {
      overflow: visible;
      border: none;
    }

    table {
      width: 100%;
      min-width: 100%;
      table-layout: fixed;
    }

    thead th {
    font-size: 8px;
    padding: 3px 1px;
    line-height: 1.1;
  }

  tbody td {
    font-size: 8px;
    padding: 2px 1px;
    line-height: 1.1;
  }

    .day-col {
    width: 18px;
    min-width: 18px;
    max-width: 18px;
    padding: 2px 1px !important;
  }

  .sticky-col-1 {
    width: 24px;
    min-width: 24px;
  }

  .sticky-col-2 {
    width: 50px;
    min-width: 50px;
  }

  .sticky-col-3 {
    width: 62px;
    min-width: 62px;
  }

  .sticky-col-4 {
    width: 120px;
    min-width: 120px;
  }

  .sticky-col-5 {
    width: 34px;
    min-width: 34px;
  }

    .total-hadir,
    .total-terlambat,
    .total-sangat-terlambat {
      width: 34px;
      min-width: 34px;
      max-width: 34px;
    }

    .legend {
      margin-top: 10px;
      gap: 8px;
      font-size: 9px;
    }

    .legend span {
      padding: 4px 8px;
      border-radius: 999px;
    }

    .summary {
      gap: 8px;
      margin-top: 12px;
    }

    .summary-card {
      padding: 10px;
      font-size: 10px;
      border-radius: 8px;
    }

    .summary-card div:last-child {
      font-size: 16px !important;
      margin-top: 4px !important;
    }

          .ttd {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            gap: 20px;
          }

          .ttd-box {
            width: 220px;
            font-size: 10px;
          }

          .ttd-space {
            height: 42px;
          }
  }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="print-bar">
              <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>
            </div>

            <div class="kop">
              <div class="logo">
                <img src="/public/logo-man2.png" alt="Logo MAN 2" />
              </div>
              <div class="kop-text">
                <h1>MAN 2 PALEMBANG</h1>
                <h2>REKAP ABSENSI SISWA PER KELAS</h2>
                <p>Jl. Prof. KH. Zainal Abidin Fikri, Komplek UIN Raden Fatah, Pahlawan, Kec. Kemuning, Kota Palembang, Sumatera Selatan 30126</p>
              </div>
            </div>

            <div class="title-box">
              <h3>Rekap Bulanan Kelas ${classId}</h3>
              <div>Bulan: <b>${monthName} ${year}</b></div>
            </div>

            <div class="meta">
              <div class="meta-item"><b>Kelas</b>: ${classId}</div>
              <div class="meta-item"><b>Semester</b>: ${semester}</div>
              <div class="meta-item"><b>Tahun Pelajaran</b>: ${tahunPelajaran}</div>
              <div class="meta-item"><b>Wali Kelas</b>: ${waliKelas}</div>
              <div class="meta-item"><b>Tempat Cetak</b>: ${tempat}</div>
              <div class="meta-item"><b>Tanggal Cetak</b>: ${safeTanggalCetak}</div>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th rowspan="2" class="sticky-col-1">No</th>
                    <th rowspan="2" class="sticky-col-2">NIS</th>
                    <th rowspan="2" class="sticky-col-3">NISN</th>
                    <th rowspan="2" class="sticky-col-4">Nama</th>
                    <th rowspan="2" class="sticky-col-5">JK</th>
                    <th colspan="${daysInMonth}">Bulan ${monthName}</th>
                  <th rowspan="2">H</th>
                    <th rowspan="2">T</th>
                  <th rowspan="2">ST</th>
                  </tr>
                  <tr>
                    ${dayHeadersHtml}
                  </tr>
                </thead>
                <tbody>
                  ${
                    tableRowsHtml ||
                    `
                    <tr>
                      <td colspan="${5 + daysInMonth + 3}" class="center">Tidak ada data siswa pada kelas ini.</td>
                    </tr>
                  `
                  }
                </tbody>
              </table>
            </div>

            <div class="legend">
              <span><b>JK</b> = Jenis Kelamin</span>
              <span><b>H</b> = Hadir</span>
              <span><b>T</b> = Terlambat</span>
              <span><b>ST</b> = Sangat Terlambat</span>
            </div>

            <div class="summary">
              <div class="summary-card hadir">
                <div>Total Hadir</div>
                <div style="font-size:28px; margin-top:8px;">
                  ${rows.reduce((sum, row) => sum + row.totalHadir, 0)}
                </div>
              </div>
              <div class="summary-card terlambat">
                <div>Total Terlambat</div>
                <div style="font-size:28px; margin-top:8px;">
                  ${rows.reduce((sum, row) => sum + row.totalTerlambat, 0)}
                </div>
              </div>
              <div class="summary-card sangat-terlambat">
                <div>Total Sangat Terlambat</div>
                <div style="font-size:28px; margin-top:8px;">
                  ${rows.reduce((sum, row) => sum + row.totalSangatTerlambat, 0)}
                </div>
              </div>
            </div>

            <div class="ttd">
            <div class="ttd-box">
              <div>Mengetahui,</div>
              <div>Kepala Madrasah</div>
              <div class="ttd-space"></div>
              <div><b>${kepalaMadrasah}</b></div>
              <div>NIP. ${nipKepalaMadrasah}</div>
            </div>

            <div class="ttd-box">
              <div>${tempat}, ${safeTanggalCetak}</div>
              <div>Wali Kelas</div>
              <div class="ttd-space"></div>
              <div><b>${waliKelas}</b></div>
              <div>NIP. ${nipWaliKelas}</div>
            </div>
          </div>
          </div>
        </body>
        </html>
      `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("EXPORT REPORT ERROR:", error);
    res.status(500).send("Gagal membuat laporan");
  }
});
app.get("/api/teacher/:teacherId/profile", async (req, res) => {
  try {
    const { teacherId } = req.params;

    const [teacherRows] = await pool.query(
      `
      SELECT
        teacher_id,
        teacher_name,
        nip,
        phone,
        email,
        username,
        status_active
      FROM teachers
      WHERE teacher_id = ?
      LIMIT 1
      `,
      [teacherId],
    );

    if (!teacherRows.length) {
      return res.status(404).json({
        success: false,
        message: "Data guru tidak ditemukan",
      });
    }

    const [roleRows] = await pool.query(
      `
      SELECT role
      FROM teacher_roles
      WHERE teacher_id = ?
      ORDER BY role ASC
      `,
      [teacherId],
    );

    const [classRows] = await pool.query(
      `
      SELECT class_id, class_name
      FROM classes
      WHERE wali_kelas_id = ?
      ORDER BY class_name ASC
      `,
      [teacherId],
    );

    res.json({
      success: true,
      data: {
        ...teacherRows[0],
        roles: roleRows.map((item) => item.role),
        homeroom_classes: classRows,
      },
    });
  } catch (error) {
    console.error("GET TEACHER PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil profil guru",
      error: error.message,
    });
  }
});

app.get("/api/teacher/:teacherId/students/search", async (req, res) => {
  try {
    const { keyword = "" } = req.query;
    const cleanKeyword = String(keyword).trim();

    if (cleanKeyword.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const likeKeyword = `%${cleanKeyword}%`;

    const [rows] = await pool.query(
      `
      SELECT
        s.student_id,
        s.nis,
        s.nisn,
        s.student_name,
        s.class_id,
        c.class_name,
        c.wali_kelas_id,
        wt.teacher_name AS wali_kelas_name,
        wt.nip AS wali_kelas_nip
      FROM students s
      LEFT JOIN classes c ON c.class_id = s.class_id
      LEFT JOIN teachers wt ON wt.teacher_id = c.wali_kelas_id
      WHERE s.status_active = 'aktif'
        AND (
          s.student_name LIKE ?
          OR s.nis LIKE ?
          OR s.nisn LIKE ?
          OR s.student_id LIKE ?
        )
      ORDER BY s.student_name ASC
      LIMIT 10
      `,
      [likeKeyword, likeKeyword, likeKeyword, likeKeyword],
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("SEARCH STUDENT FOR PERMIT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mencari siswa",
      error: error.message,
    });
  }
});

app.post("/api/student-permits", async (req, res) => {
  try {
    const {
      teacher_id,
      student_id,
      permit_type,
      permit_date,
      permit_time,
      reason,
    } = req.body;

    if (!teacher_id || !student_id) {
      return res.status(400).json({
        success: false,
        message: "ID guru dan siswa wajib diisi",
      });
    }

    const [teacherRows] = await pool.query(
      `
      SELECT teacher_id, teacher_name, status_active
      FROM teachers
      WHERE teacher_id = ?
      LIMIT 1
      `,
      [teacher_id],
    );

    if (!teacherRows.length) {
      return res.status(404).json({
        success: false,
        message: "Guru tidak ditemukan",
      });
    }

    const teacher = teacherRows[0];

    if (teacher.status_active !== "aktif") {
      return res.status(403).json({
        success: false,
        message: "Akun guru tidak aktif",
      });
    }

    const [studentRows] = await pool.query(
      `
      SELECT
        s.student_id,
        s.nis,
        s.nisn,
        s.student_name,
        s.class_id,
        c.wali_kelas_id,
        wt.teacher_name AS wali_kelas_name
      FROM students s
      LEFT JOIN classes c ON c.class_id = s.class_id
      LEFT JOIN teachers wt ON wt.teacher_id = c.wali_kelas_id
      WHERE s.student_id = ?
        AND s.status_active = 'aktif'
      LIMIT 1
      `,
      [student_id],
    );

    if (!studentRows.length) {
      return res.status(404).json({
        success: false,
        message: "Siswa tidak ditemukan atau tidak aktif",
      });
    }

    const student = studentRows[0];
    const now = new Date();

    const finalDate = permit_date || formatDateToYmd(now);
    const finalTime = permit_time || formatTimeToHms(now);
    const permitId = `IZIN-${Date.now()}-${student.student_id}`;

    await pool.query(
      `
      INSERT INTO student_permits (
        permit_id,
        teacher_id,
        teacher_name,
        student_id,
        student_name,
        nis,
        nisn,
        class_id,
        wali_kelas_id,
        wali_kelas_name,
        permit_type,
        permit_date,
        permit_time,
        reason,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'dibuat')
      `,
      [
        permitId,
        teacher.teacher_id,
        teacher.teacher_name,
        student.student_id,
        student.student_name,
        student.nis || null,
        student.nisn || null,
        student.class_id || null,
        student.wali_kelas_id || null,
        student.wali_kelas_name || null,
        permit_type || "izin_keluar",
        finalDate,
        finalTime,
        reason || null,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Form izin siswa berhasil dibuat",
      data: {
        permit_id: permitId,
      },
    });
  } catch (error) {
    console.error("CREATE STUDENT PERMIT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat form izin siswa",
      error: error.message,
    });
  }
});
app.get("/api/teacher/:teacherId/student-permits", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const {
      dateFrom = "",
      dateTo = "",
      permitType = "",
      status = "",
      keyword = "",
    } = req.query;

    const conditions = ["teacher_id = ?"];
    const values = [teacherId];

    if (dateFrom) {
      conditions.push("permit_date >= ?");
      values.push(dateFrom);
    }

    if (dateTo) {
      conditions.push("permit_date <= ?");
      values.push(dateTo);
    }

    if (permitType) {
      conditions.push("permit_type = ?");
      values.push(permitType);
    }

    if (status) {
      conditions.push("status = ?");
      values.push(status);
    }

    if (keyword) {
      conditions.push(`
        (
          student_name LIKE ?
          OR nis LIKE ?
          OR nisn LIKE ?
          OR class_id LIKE ?
        )
      `);

      const likeKeyword = `%${keyword}%`;
      values.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }

    const [rows] = await pool.query(
      `
      SELECT
        permit_id,
        teacher_id,
        teacher_name,
        student_id,
        student_name,
        nis,
        nisn,
        class_id,
        wali_kelas_id,
        wali_kelas_name,
        permit_type,
        permit_date,
        permit_time,
        reason,
        status,
        created_at
      FROM student_permits
      WHERE ${conditions.join(" AND ")}
      ORDER BY permit_date DESC, permit_time DESC, created_at DESC
      LIMIT 200
      `,
      values,
    );

    const summary = {
      total: rows.length,
      dibuat: rows.filter((item) => item.status === "dibuat").length,
      dibatalkan: rows.filter((item) => item.status === "dibatalkan").length,
    };

    res.json({
      success: true,
      summary,
      data: rows,
    });
  } catch (error) {
    console.error("GET TEACHER STUDENT PERMITS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil history ijin siswa",
      error: error.message,
    });
  }
});
app.get("/api/export/homeroom-time-report", async (req, res) => {
  try {
    const {
      teacherId = "",
      classId = "",
      month = "",
      year = "",
      waliKelas = "",
      nipWaliKelas = "",
      semester = "Ganjil",
      tahunPelajaran = "2025/2026",
      tempat = "Palembang",
    } = req.query;

    if (!teacherId || !classId || !month || !year) {
      return res
        .status(400)
        .send("teacherId, classId, month, dan year wajib diisi");
    }

    const monthNumber = Number(month);
    const yearNumber = Number(year);

    if (
      Number.isNaN(monthNumber) ||
      Number.isNaN(yearNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return res.status(400).send("month atau year tidak valid");
    }

    const [classRows] = await pool.query(
      `
      SELECT class_id, class_name, wali_kelas_id
      FROM classes
      WHERE class_id = ?
        AND wali_kelas_id = ?
      LIMIT 1
      `,
      [classId, teacherId],
    );

    if (!classRows.length) {
      return res
        .status(403)
        .send("Anda tidak berhak mencetak laporan kelas ini");
    }

    const classData = classRows[0];

    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const monthName = monthNames[monthNumber - 1];
    const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

    const monthStart = `${yearNumber}-${String(monthNumber).padStart(2, "0")}-01`;
    const monthEnd = `${yearNumber}-${String(monthNumber).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const [students] = await pool.query(
      `
      SELECT
        student_id,
        nis,
        nisn,
        student_name,
        gender,
        class_id
      FROM students
      WHERE class_id = ?
        AND status_active = 'aktif'
      ORDER BY student_name ASC
      `,
      [classId],
    );

    const [attendanceRows] = await pool.query(
      `
      SELECT
        student_id,
        attendance_date,
        attendance_time,
        status
      FROM attendance
      WHERE class_id = ?
        AND attendance_date BETWEEN ? AND ?
      ORDER BY attendance_date ASC, attendance_time ASC
      `,
      [classId, monthStart, monthEnd],
    );

    const attendanceMap = {};

    attendanceRows.forEach((row) => {
      const day = new Date(row.attendance_date).getDate();

      if (!attendanceMap[row.student_id]) {
        attendanceMap[row.student_id] = {};
      }

      if (!attendanceMap[row.student_id][day]) {
        attendanceMap[row.student_id][day] = {
          datang: "",
          pulang: "",
        };
      }

      if (row.status === "pulang") {
        attendanceMap[row.student_id][day].pulang = String(
          row.attendance_time || "",
        ).slice(0, 5);
      } else {
        attendanceMap[row.student_id][day].datang = String(
          row.attendance_time || "",
        ).slice(0, 5);
      }
    });

    const today = new Date();
    const tanggalCetak = `${tempat}, ${String(today.getDate()).padStart(2, "0")} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `
        <th colspan="2">${day}</th>
      `;
    }).join("");

    const subHeaders = Array.from({ length: daysInMonth }, () => {
      return `
        <th>D</th>
        <th>P</th>
      `;
    }).join("");

    const bodyRows = students
      .map((student, index) => {
        const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const data = attendanceMap[student.student_id]?.[day] || {};

          return `
          <td>${data.datang || ""}</td>
          <td>${data.pulang || ""}</td>
        `;
        }).join("");

        return `
        <tr>
          <td>${index + 1}</td>
          <td>${student.nis || ""}</td>
          <td>${student.nisn || ""}</td>
          <td class="name">${student.student_name || ""}</td>
          <td>${student.gender || ""}</td>
          ${dayCells}
        </tr>
      `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Laporan Jam Datang dan Pulang</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #111827;
            margin: 24px;
          }

          .kop {
            text-align: center;
            border-bottom: 3px double #111827;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }

          .kop h2,
          .kop h3,
          .kop p {
            margin: 4px 0;
          }

          .title {
            text-align: center;
            margin: 18px 0;
          }

          .meta {
            margin-bottom: 14px;
            font-size: 13px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }

          th,
          td {
            border: 1px solid #111827;
            padding: 4px;
            text-align: center;
            vertical-align: middle;
          }

          th {
            background: #f3f4f6;
          }

          .name {
            text-align: left;
            min-width: 160px;
          }

          .note {
            margin-top: 10px;
            font-size: 11px;
          }

          .signature {
            margin-top: 28px;
            display: flex;
            justify-content: flex-end;
          }

          .signature-box {
            width: 280px;
            text-align: center;
            font-size: 13px;
          }

          .signature-space {
            height: 72px;
          }

          @media print {
            body {
              margin: 10mm;
            }

            button {
              display: none;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          }
        </style>
      </head>

      <body>
        <button onclick="window.print()" style="margin-bottom:12px; padding:8px 12px;">
          Cetak
        </button>

        <div class="kop">
          <h2>LAPORAN ABSENSI SISWA</h2>
          <h3>JAM DATANG DAN JAM PULANG</h3>
          <p>Kelas ${classData.class_name || classData.class_id}</p>
        </div>

        <div class="title">
          <b>Bulan ${monthName} ${yearNumber}</b>
        </div>

        <div class="meta">
          <div>Semester: ${semester}</div>
          <div>Tahun Pelajaran: ${tahunPelajaran}</div>
          <div>Wali Kelas: ${waliKelas || "-"}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th rowspan="2">No</th>
              <th rowspan="2">NIS</th>
              <th rowspan="2">NISN</th>
              <th rowspan="2">Nama Siswa</th>
              <th rowspan="2">JK</th>
              ${dayHeaders}
            </tr>
            <tr>
              ${subHeaders}
            </tr>
          </thead>

          <tbody>
            ${bodyRows || `<tr><td colspan="${5 + daysInMonth * 2}">Belum ada siswa.</td></tr>`}
          </tbody>
        </table>

        <div class="note">
          Keterangan: D = Jam Datang, P = Jam Pulang.
        </div>

        <div class="signature">
          <div class="signature-box">
            <div>${tanggalCetak}</div>
            <div>Wali Kelas</div>
            <div class="signature-space"></div>
            <div><b>${waliKelas || "-"}</b></div>
            <div>NIP. ${nipWaliKelas || "-"}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("EXPORT HOMEROOM TIME REPORT ERROR:", error);
    res.status(500).send("Gagal mencetak laporan jam datang dan pulang");
  }
});

app.use(express.static(path.join(__dirname, "dist")));
const db = require("./db");
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "Endpoint API tidak ditemukan",
    });
  }

  res.sendFile(path.join(clientDistPath, "index.html"), (error) => {
    if (error) {
      res.status(404).json({
        success: false,
        message:
          "Frontend belum dibuild. Jalankan npm run build terlebih dahulu.",
      });
    }
  });
});
// ✅ WA OTOMATIS DINONAKTIFKAN
// setInterval(absentSchedulerTick, 60000);
// absentSchedulerTick();
console.log("⚠️ WA otomatis ke ortu dinonaktifkan");

//ini esebab duplikasi wam karena di woeker js juga ada
//setInterval(processWAQueue, 3000); // Jalankan setiap 3 detik
//console.log("✅ WA Queue Worker aktif");

app.listen(PORT, "0.0.0.0", async () => {
  const frontendReady = fs.existsSync(path.join(clientDistPath, "index.html"));
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend path: ${clientDistPath}`);
  console.log(`Frontend ready: ${frontendReady}`);

  try {
    await testConnection();
    await ensureSchema();
    //setInterval(absentSchedulerTick, 60 * 1000);
    //console.log("Penjadwal absen otomatis aktif (cek tiap menit)");
  } catch (error) {
    console.error("Server started but DB setup failed:", error.message);
  }
  
});