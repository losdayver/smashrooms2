const express = require("express");
const path = require("path");

const app = express();

const staticRoot = "../static/";

app.use(express.json());
app.use(express.static(staticRoot));

app.set("styles", path.resolve(__dirname + staticRoot + "styles"));
app.set("img", path.resolve(__dirname + staticRoot + "img"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, staticRoot, "html", "index.html"));
});

app.get("/components", (req, res) => {
  res.sendFile(path.join(__dirname, staticRoot, "html", "components.html"));
});

app.listen(5890, "0.0.0.0", () => {
  console.log(`static server listening on port ${5890}!`);
});
