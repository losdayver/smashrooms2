import { createWSServer, createWSTestingServer } from "./game/server/server";

const server = createWSTestingServer(5889);
server.run();
