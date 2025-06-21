import "module-alias/register";
import { getWSServer } from "@server/game/server/server";
import { IPGQueryNames, PGQuerier } from "./db/pgQuerier";
import { env } from "@server/env";
env;

const pg = new PGQuerier();

const server = getWSServer(5889);
server.start();
