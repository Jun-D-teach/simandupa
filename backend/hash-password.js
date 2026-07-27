const bcrypt = require("bcrypt");

async function run() {
  const plainPassword = "admin123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  console.log("Password asli :", plainPassword);
  console.log("Hash bcrypt   :", hashedPassword);
}

run();