import "module-alias/register";
import { getWSServer } from "@server/game/server/server";
import { PGQuerier } from "./db/dbQuerier";

const pg = new PGQuerier();

(async () => {
  const res = await pg.makeQuery("qHelloWorld");
  console.log(res);
})();

const server = getWSServer(5889);
server.start();
