import { config } from "./config";
import { WebSocket } from "ws";

export const bufferFromObj = (obj: object) => Buffer.from(JSON.stringify(obj));
export const severityLog = (
  msg: string | Error,
  severity: "info" | "warning" | "error" = "info"
) => {
  if (typeof msg == "string") {
    if (config.logSeverityLevels.includes(severity))
      console.log(`${timeFormat(new Date())} ${severity}: ${msg}`);
  } else if (typeof msg == "object") {
    const err = msg as Error;
    if (config.logSeverityLevels.includes("error"))
      console.log(
        `${timeFormat(new Date())} error: ${err.message}\nstack: ${err.stack}`
      );
  }
};
export const timeFormat = (date: Date) =>
  `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
export const wslogSend = (
  socket: WebSocket,
  socketMsg: object,
  logMsg: string = "",
  severity: "info" | "warning" | "error" = "info"
) => {
  if (logMsg) severityLog(logMsg, severity);
  socket.send(bufferFromObj(socketMsg));
};
