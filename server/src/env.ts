import type { PoolConfig } from "pg";
import { z } from "zod";

interface DatabaseConfig {
  postgres?: PoolConfig;
}

const port = z.number().int().min(1).max(65_535);
const serverConfigSchema = z.object({
  webSocket: z.object({ port }),
  api: z.object({ enabled: z.boolean(), port }),
  editor: z.object({ enabled: z.boolean(), testingServerPort: port }),
});

export const env = {
  server: serverConfigSchema.parse(require("../../config/server.json")),
  dbConfig: {} as DatabaseConfig,
} as const;
