import { getWSTestingServer } from "./game/server/server";

const server = getWSTestingServer(5889);
server.start();
