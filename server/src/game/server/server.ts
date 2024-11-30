import { severityLog } from "../../utils";
import { Communicatior } from "../communicator/communicator";
import { ICommunicatior } from "../communicator/communicatorTypes";
import { Crate } from "../scene/props";
import { Scene } from "../scene/scene";
import { IScene } from "../scene/sceneTypes";
import { WSSocketServer } from "../sockets/sockets";
import { ISocketServer } from "../sockets/socketsTypes";

export class Server {
  private scene: IScene;
  private communicatior: ICommunicatior;
  private socketServer: ISocketServer;

  run = () => {
    global.setInterval(this.scene.tick, 50); // todo make fps based timing with locking
  };

  constructor(
    socketServer: ISocketServer,
    communicatior: ICommunicatior,
    scene: IScene
  ) {
    this.scene = scene;
    this.communicatior = communicatior;
    this.socketServer = socketServer;

    this.communicatior.makeSubscribe(this.socketServer);
    this.scene.makeSubscribe(this.communicatior);
    severityLog(`server started`);
  }
}

export const createWSServer = (port: number) => {
  severityLog(`starting server on port ${port}`);
  const scene = new Scene();
  const communicator = new Communicatior(scene);
  const wsServer = new WSSocketServer(communicator, port);
  return new Server(wsServer, communicator, scene);
};

export const createWSTestingServer = (port: number) => {
  severityLog(`starting server on port ${port}`);
  const scene = new Scene();
  const template = {
    props: [
      ...[...Array(10).keys()].map(
        (i) =>
          new Crate(scene, {
            positioned: {
              posX: 10 + i * 100,
              posY: 10,
            },
          })
      ),
    ],
  };
  scene.loadTemplate(template);
  const communicator = new Communicatior(scene);
  const wsServer = new WSSocketServer(communicator, port);
  return new Server(wsServer, communicator, scene);
};
