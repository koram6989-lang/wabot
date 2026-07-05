const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const fs = require("fs");

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {

    if (connection === "open") {
      console.log("BOT CONNECTED");
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

    const replies =
      JSON.parse(fs.readFileSync("replies.json"));

    const keyword = text.toLowerCase().trim();

    if (replies[keyword]) {

      await sock.sendMessage(sender, {
        text: replies[keyword]
      });

    }

  });

}

startBot();
