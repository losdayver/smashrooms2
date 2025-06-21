import { readFileSync } from "fs";
import { config } from "./config";

const getEnv = (route: string) => JSON.parse(readFileSync(route).toString());

export const env = {
  dbConfig: getEnv(config.dbConfigRoute),
} as const;
