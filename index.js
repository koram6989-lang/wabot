const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

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

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    console.log("UPDATE:");
    console.log(JSON.stringify(update, null, 2));

    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ BOT CONNECTED");
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.code;

      console.log("❌ DISCONNECTED:", reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log("♻️ Reconnecting in 5 seconds...");
        setTimeout(() => {
          startBot();
        }, 5000);
      } else {
        console.log("⚠️ Logged out. Hapus folder session.");
      }
    }
  });
}

startBot().catch(console.error);
