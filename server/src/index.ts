import "module-alias/register";
import { getWSServer } from "@server/game/server/server";
import { IPGQueryNames, PGQuerier } from "./db/pgQuerier";
import { env } from "@server/env";
env;

const pg = new PGQuerier();

(async () => {
  const res = await pg.makeQuery("qHelloWorld1" satisfies IPGQueryNames);
  console.log(res);
})();

const server = getWSServer(5889);
server.start();
