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
  socket.send(JSON.stringify(socketMsg));
};
export class Mutex<T> {
  value: T;
  private queue: ((value: unknown) => void)[];
  private locked: boolean;
  constructor(value: T) {
    this.value = value;
    this.queue = [];
    this.locked = false;
  }
  acquire = (): Promise<() => void> => {
    const unlock = () => {
      this.locked = false;
      if (this.queue.length) {
        const nextResolve = this.queue.shift();
        nextResolve(unlock);
      }
    };
    return new Promise((resolve) => {
      if (this.locked) {
        this.queue.push(resolve as any);
      } else {
        this.locked = true;
        resolve(unlock);
      }
    });
  };
  async unlock() {
    if (!this.locked) {
      throw new Error("Mutex is already unlocked");
    }
    this.locked = false;
    if (this.queue.length) {
      const nextResolve = this.queue.shift();
      nextResolve(this.unlock.bind(this));
    }
  }
}
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P];
};
export const doBenchmark = () => {
  const start = new Date().getTime();
  return () => new Date().getTime() - start;
};
export const getRandomBetween = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};
export const pickRandom = (array: any[]) =>
  array[Math.floor(Math.random() * array.length)];
export const stringToHash = (str: string) => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return Math.abs(hash);
};
