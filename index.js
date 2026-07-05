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
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ BOT CONNECTED");
    }

    if (connection === "close") {

      const reason =
        lastDisconnect?.error?.output?.statusCode;

      console.log("❌ DISCONNECTED:", reason);

      // auto reconnect
      if (reason !== DisconnectReason.loggedOut) {
        startBot();
      }
    }

  });

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
      console.log("replies.json error");
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
