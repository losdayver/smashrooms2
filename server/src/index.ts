import { getWSServer } from "./game/server/server";

const server = getWSServer(5889);
server.start();
