const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.get("/api/replies", (req, res) => {

  const data =
    JSON.parse(fs.readFileSync("replies.json"));

  res.json(data);

});

app.post("/api/save", (req, res) => {

  const { keyword, reply } = req.body;

  let data =
    JSON.parse(fs.readFileSync("replies.json"));

  data[keyword.toLowerCase()] = reply;

  fs.writeFileSync(
    "replies.json",
    JSON.stringify(data, null, 2)
  );

  res.json({
    status: true
  });

});

app.post("/api/delete", (req, res) => {

  const { keyword } = req.body;

  let data =
    JSON.parse(fs.readFileSync("replies.json"));

  delete data[keyword];

  fs.writeFileSync(
    "replies.json",
    JSON.stringify(data, null, 2)
  );

  res.json({
    status: true
  });

});

app.listen(3000, () => {

  console.log("Panel running");
  console.log("http://localhost:3000");

});});
