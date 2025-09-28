import "module-alias/register";
import { getWSServer } from "@server/game/server/server";
import { env } from "@server/env";
import { startApi } from "./game/server/api";

const server = getWSServer(5889);
server.start();

if (env.apiConfig?.allow) startApi();
