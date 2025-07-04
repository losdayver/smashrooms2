import path from "path";

export const config = {
  logSeverityLevels: ["info", "error", "warning"],
  stagesRoute: path.resolve(__dirname, "..", "..", "static", "stages"),
  dbConfigRoute: path.resolve(__dirname, "..", "..", ".env", "dbConfig.json"),
};
