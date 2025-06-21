import "module-alias/register";
import { getWSServer } from "@server/game/server/server";
import { IPGQueryNames, PGQuerier } from "./db/pgQuerier";
import { env } from "@server/env";
env;

const pg = new PGQuerier();

(async () => {
  const res = await pg.makeQuery({
    queryName: "qUpsertTopScore",
    params: { tag: "player123", kills: 20 },
    target: "server",
  });
  console.log(res);
  const res1 = await pg.makeQuery({
    queryName: "qTopScoresByTag",
    params: { limit: 10 },
  });
  console.log(res1);
})();

const server = getWSServer(5889);
server.start();
