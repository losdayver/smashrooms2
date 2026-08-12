import type { PoolConfig } from "pg";
import { z, infer as zInfer } from "zod";

interface DatabaseConfig {
  postgres?: PoolConfig;
}

const port = z.number().int().min(1).max(65_535);
const serverConfigSchema = z.object({
  webSocket: z.object({ port }),
  api: z.object({ enabled: z.boolean(), port }),
  editor: z.object({ enabled: z.boolean(), testingServerPort: port }),
});

type ServerConfig = zInfer<typeof serverConfigSchema>

let config: ServerConfig;
try {
  config = require("../../config/server.json")
} catch {
  config = require("../../config/server-example.json")
}

export const env = {
  server: serverConfigSchema.parse(config),
  dbConfig: {} as DatabaseConfig,
} as const;
