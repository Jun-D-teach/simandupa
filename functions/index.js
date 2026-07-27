const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.sendWhatsappNotification = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    try {
      if (!data) {
        console.log("Data notifikasi kosong");
        return null;
      }

      if (data.channel !== "whatsapp") {
        console.log("Bukan channel whatsapp");
        return null;
      }

      if (data.status !== "pending") {
        console.log("Status bukan pending, lewati");
        return null;
      }

      const token = functions.config().fonnte.token;

      if (!token) {
        console.error("Token Fonnte tidak ditemukan di config");
        await snap.ref.update({
          status: "failed",
          error_message: "Token Fonnte tidak ditemukan"
        });
        return null;
      }

      const target = data.parent_phone;
      const message = data.message;

      if (!target || !message) {
        console.error("Target atau message kosong");
        await snap.ref.update({
          status: "failed",
          error_message: "Target atau message kosong"
        });
        return null;
      }

      const params = new URLSearchParams();
      params.append("target", target);
      params.append("message", message);
      params.append("countryCode", "0");

      const response = await axios.post(
        "https://api.fonnte.com/send",
        params,
        {
          headers: {
            Authorization: token
          }
        }
      );

      console.log("Fonnte response:", response.data);

      await snap.ref.update({
        status: response.data && response.data.status ? "sent" : "failed",
        sent_at: new Date().toISOString(),
        provider_response: response.data || null
      });

      return null;
    } catch (error) {
      console.error("Gagal kirim WA:", error.message);

      await snap.ref.update({
        status: "failed",
        error_message: error.message,
        sent_at: new Date().toISOString()
      });

      return null;
    }
  });