import "module-alias/register";
import { getWSServer } from "@server/game/server/server";
import { PGQuerier } from "./db/pgQuerier";

const pg = new PGQuerier();

(async () => {
  const res = await pg.makeQuery("qTopScoresByTag", { limit: 10 });
  console.log(res);
})();

const server = getWSServer(5889);
server.start();
