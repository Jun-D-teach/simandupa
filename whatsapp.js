const fetch = require("node-fetch");

async function sendWhatsApp(phone, message) {
  try {
    let cleanPhone = String(phone || "").replace(/\D/g, "");
     if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.substring(1);
    } 
    if (!cleanPhone) {
      return {
        success: false,
        message: "Nomor tujuan kosong"
      };
    }

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target: cleanPhone,
        message: message
      })
    });

    const text = await response.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { raw: text };
    }

    console.log("FONNTE STATUS:", response.status);
    console.log("FONNTE RESULT:", result);

    const ok =
      response.ok &&
      result &&
      (
        result.status === true ||
        result.status === "true" ||
        result.detail === "success" ||
        result.processed !== undefined
      );

    return {
      success: !!ok,
      httpStatus: response.status,
      data: result
    };
  } catch (error) {
    console.error("WA ERROR:", error);
    return {
      success: false,
      message: error.message
    };
  }
}

module.exports = { sendWhatsApp };