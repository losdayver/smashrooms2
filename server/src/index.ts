import "module-alias/register";
import { getWSServer, startApi } from "@server/game/server/server";
import { env } from "@server/env";

const server = getWSServer(5889);
server.start();

if (env.apiConfig?.allow) startApi();
