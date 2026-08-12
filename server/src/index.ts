import "module-alias/register";
import { getWSServer } from "@server/game/server/server";
import { env } from "@server/env";
import { startApi } from "./game/server/api";

const server = getWSServer(env.server.webSocket.port);
server.start();

if (env.server.api.enabled) startApi();
