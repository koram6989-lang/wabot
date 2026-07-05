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

    // 🔥 WAJIB supaya QR muncul
    printQRInTerminal: true,

    // 🔥 stabil logging (hindari noise crash)
    logger: pino({ level: "silent" }),

    // 🔥 device fingerprint stabil
    browser: ["Ubuntu", "Chrome", "22.04"],

    // 🔥 NODE 24 FIX MODE
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,

    // 🔥 timeout safety (penting di Node 24)
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000
  });

  // simpan session
  sock.ev.on("creds.update", saveCreds);

  // koneksi handler
  sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect, qr } = update;

    // QR CODE
    if (qr) {
      console.log("\n========================");
      console.log("📌 SCAN QR DI BAWAH INI:");
      console.log("========================\n");
      console.log(qr);
    }

    // CONNECTED
    if (connection === "open") {
      console.log("\n✅ BOT CONNECTED SUCCESS\n");
    }

    // DISCONNECTED
    if (connection === "close") {

      const reason =
        lastDisconnect?.error?.output?.statusCode;

      console.log("\n❌ DISCONNECTED:", reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log("♻️ Reconnecting...");
        startBot();
      } else {
        console.log("⚠️ Logged out, hapus folder session.");
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
