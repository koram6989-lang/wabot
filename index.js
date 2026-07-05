const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const pino = require("pino");

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,

    // 🔥 WAJIB QR MUNCUL DI TERMINAL
    printQRInTerminal: true,

    // 🔥 stabil log (hindari noise crash)
    logger: pino({ level: "silent" }),

    // 🔥 fingerprint device stabil
    browser: ["Ubuntu", "Chrome", "22.04"],

    // 🔥 FIX NODE 24 STABILITY
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,

    // 🔥 hindari overload sync WA Web
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  // simpan session
  sock.ev.on("creds.update", saveCreds);

  // koneksi update (QR + status)
  sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect, qr } = update;

    // QR CODE
    if (qr) {
      console.log("\n========================");
      console.log("📌 SCAN QR INI:");
      console.log("========================\n");
      console.log(qr);
    }

    // CONNECTED
    if (connection === "open") {
      console.log("\n✅ BOT CONNECTED SUCCESS\n");
    }

    // DISCONNECTED + AUTO RECONNECT
    if (connection === "close") {

      const reason =
        lastDisconnect?.error?.output?.statusCode;

      console.log("\n❌ DISCONNECTED:", reason);

      // auto reconnect kecuali logout permanen
      if (reason !== DisconnectReason.loggedOut) {
        console.log("♻️ Reconnecting...");
        startBot();
      } else {
        console.log("⚠️ Logged out! Hapus folder session.");
      }
    }

  });

  // pesan masuk
  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];
    if (!msg.message) return;

    const sender = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text) return;

    let replies = {};

    try {
      replies = JSON.parse(fs.readFileSync("replies.json"));
    } catch (e) {
      console.log("❌ replies.json error");
    }

    const keyword = text.toLowerCase().trim();

    if (replies[keyword]) {
      await sock.sendMessage(sender, {
        text: replies[keyword]
      });
    }

  });

}

startBot();
