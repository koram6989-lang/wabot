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

    printQRInTerminal: true,

    logger: pino({ level: "silent" }),

    browser: ["Ubuntu", "Chrome", "22.04"],

    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,

    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000
  });

  // SIMPAN SESSION
  sock.ev.on("creds.update", saveCreds);

  // CONNECTION HANDLER
  sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("\n✅ BOT CONNECTED SUCCESS\n");
    }

    if (connection === "close") {

      const statusCode =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.code;

      console.log("\n❌ DISCONNECTED:", statusCode);

      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("♻️ Reconnecting...\n");

        setTimeout(() => {
          startBot();
        }, 3000);

      } else {
        console.log("⚠️ Logged out. Hapus folder session lalu scan ulang QR.");
      }
    }

  });

  // MESSAGE HANDLER
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
      const file = fs.readFileSync("replies.json", "utf-8");
      replies = JSON.parse(file || "{}");
    } catch (e) {
      console.log("❌ replies.json error / kosong");
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
