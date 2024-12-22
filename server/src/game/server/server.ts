import { severityLog } from "../../utils";
import { Communicator } from "../communicator/communicator";
import { ICommunicator } from "../communicator/communicatorTypes";
import { Scene } from "../scene/scene";
import { IScene } from "../scene/sceneTypes";
import { WSSocketServer } from "../sockets/sockets";
import { ISocketServer } from "../sockets/socketsTypes";
import fs from "fs";
import path from "path";

export class Server {
  private scene: IScene;
  private communicator: ICommunicator;
  private socketServer: ISocketServer;

  run = () => setInterval(this.scene.tick, 32);

  constructor(
    socketServer: ISocketServer,
    communicator: ICommunicator,
    scene: IScene
  ) {
    this.scene = scene;
    this.communicator = communicator;
    this.socketServer = socketServer;

    this.communicator.subscribe(this.socketServer);
    this.scene.subscribe(this.communicator);
    severityLog(`server started`);
  }
}

export const createWSServer = (port: number) => {
  severityLog(`starting server on port ${port}`);
  const scene = new Scene();
  const communicator = new Communicator(scene);
  const wsServer = new WSSocketServer(communicator, port);
  return new Server(wsServer, communicator, scene);
};

export const createWSTestingServer = (port: number) => {
  const layoutData = fs
    .readFileSync(
      path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "static",
        "stages",
        "testing",
        "testing.layout"
      )
    )
    .toString(); // todo change this
  const layoutMeta = JSON.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "static",
          "stages",
          "testing",
          "testing.meta.json"
        )
      )
      .toString()
  ); // todo change this

  severityLog(`starting server on port ${port}`);
  const scene = new Scene({
    meta: layoutMeta,
    layoutData,
  });
  const communicator = new Communicator(scene);
  const wsServer = new WSSocketServer(communicator, port);
  return new Server(wsServer, communicator, scene);
};
