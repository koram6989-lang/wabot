const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const pino = require("pino");

async function startBot() {
const { state, saveCreds } = await useMultiFileAuthState("./session");

const sock = makeWASocket({
auth: state,
logger: pino({ level: "silent" }),
browser: ["Ubuntu", "Chrome", "22.04"]
});

sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async (update) => {
const { connection, lastDisconnect } = update;

console.log("UPDATE:", update);

if (connection === "open") {
  console.log("✅ BOT CONNECTED");
}

if (connection === "close") {
  const reason =
    lastDisconnect?.error?.output?.statusCode ||
    lastDisconnect?.error?.code;

  console.log("❌ CONNECTION CLOSED:", reason);

  if (reason !== DisconnectReason.loggedOut) {
    console.log("♻️ RECONNECTING...");
    setTimeout(() => {
      startBot();
    }, 5000);
  } else {
    console.log("⚠️ SESSION LOGGED OUT");
  }
}

});

try {
if (!sock.authState.creds.registered) {
const nomor = "6283848834062"; // GANTI DENGAN NOMOR WA KAMU

  const code = await sock.requestPairingCode(nomor);

  console.log("");
  console.log("================================");
  console.log("PAIRING CODE:");
  console.log(code);
  console.log("================================");
  console.log("");
}

} catch (err) {
console.log("❌ GAGAL MEMBUAT PAIRING CODE");
console.log(err);
}

sock.ev.on("messages.upsert", async ({ messages }) => {
try {
const msg = messages[0];

  if (!msg.message) return;
  if (msg.key.fromMe) return;

  const sender = msg.key.remoteJid;

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    "";

  if (!text) return;

  let replies = {};

  try {
    replies = JSON.parse(
      fs.readFileSync("./replies.json", "utf8")
    );
  } catch {
    replies = {};
  }

  const keyword = text.toLowerCase().trim();

  if (replies[keyword]) {
    await sock.sendMessage(sender, {
      text: replies[keyword]
    });

    console.log(
      `[AUTO REPLY] ${keyword} -> ${sender}`
    );
  }
} catch (err) {
  console.log("MESSAGE ERROR:", err);
}

});
}

startBot().catch(console.error);
