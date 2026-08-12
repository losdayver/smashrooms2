const express = require("express");
const path = require("path");

const app = express();

const staticRoot = "../static/";

app.use(express.json());

const noCache = (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};
const scriptsPath = path.resolve(__dirname + staticRoot + "scripts");
app.use("/scripts", noCache, express.static(scriptsPath));
app.use(express.static(staticRoot));

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, staticRoot, "html", "index.html"));
});

app.listen(5890, "0.0.0.0", () => {
  console.log(`static server listening on port ${5890}!`);
});
