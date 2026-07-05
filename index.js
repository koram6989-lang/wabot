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
    browser: ["Ubuntu", "Chrome", "22.04"]
  });

  // simpan session
  sock.ev.on("creds.update", saveCreds);

  // koneksi update (QR + status)
  sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect, qr } = update;

    // QR CODE
    if (qr) {
      console.log("\n=== SCAN QR DI BAWAH INI ===\n");
      console.log(qr);
    }

    // CONNECTED
    if (connection === "open") {
      console.log("\n✅ BOT CONNECTED\n");
    }

    // DISCONNECTED
    if (connection === "close") {

      const reason =
        lastDisconnect?.error?.output?.statusCode;

      console.log("❌ DISCONNECTED:", reason);

      // auto reconnect (kecuali logout)
      if (reason !== DisconnectReason.loggedOut) {
        console.log("♻️ Reconnecting...");
        startBot();
      } else {
        console.log("⚠️ Logged out, delete session folder!");
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
