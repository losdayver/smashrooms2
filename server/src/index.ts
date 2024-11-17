import { createWSServer } from "./game/server/server";

const server = createWSServer(5889);
server.run();
