import { readFileSync } from "fs";
import { config } from "./config";

const getEnv = (route: string) => {
  try {
    return JSON.parse(readFileSync(route).toString());
  } catch {
    return {};
  }
};

export const env = {
  dbConfig: getEnv(config.dbConfigRoute),
  editorConfig: getEnv(config.editorConfigRoute),
  apiConfig: getEnv(config.editorConfigRoute),
} as const;
