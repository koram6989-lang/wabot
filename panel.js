const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tampilkan index.html dari root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Ambil semua keyword
app.get("/api/replies", (req, res) => {

    try {

        const data = JSON.parse(
            fs.readFileSync("replies.json", "utf8")
        );

        res.json(data);

    } catch {

        res.json({});

    }

});

// Simpan keyword
app.post("/api/save", (req, res) => {

    const { keyword, reply } = req.body;

    if (!keyword || !reply) {

        return res.json({
            status: false,
            message: "Keyword dan balasan wajib diisi"
        });

    }

    let data = {};

    try {

        data = JSON.parse(
            fs.readFileSync("replies.json", "utf8")
        );

    } catch {}

    data[keyword.toLowerCase().trim()] = reply;

    fs.writeFileSync(
        "replies.json",
        JSON.stringify(data, null, 2)
    );

    res.json({
        status: true,
        message: "Berhasil disimpan"
    });

});

// Hapus keyword
app.post("/api/delete", (req, res) => {

    const { keyword } = req.body;

    let data = {};

    try {

        data = JSON.parse(
            fs.readFileSync("replies.json", "utf8")
        );

    } catch {}

    delete data[keyword];

    fs.writeFileSync(
        "replies.json",
        JSON.stringify(data, null, 2)
    );

    res.json({
        status: true,
        message: "Berhasil dihapus"
    });

});

// Jalankan server
const PORT = 3000;

app.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log(" PANEL BOT BERJALAN");
    console.log("================================");
    console.log(`http://localhost:${PORT}`);
    console.log("");

});
