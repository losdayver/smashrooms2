import "module-alias/register";
import { getWSServer } from "@server/game/server/server";
import { env } from "@server/env";
env;

const server = getWSServer(5889);
server.start();
