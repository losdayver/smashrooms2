import { Communicatior } from "../communicator/communicator";
import { ICommunicatior } from "../communicator/communicatorTypes";
import { Scene } from "../scene/scene";
import { IScene } from "../scene/sceneTypes";
import { WSSocketServer } from "../sockets/sockets";
import { ISocketServer } from "../sockets/socketsTypes";

export class Server {
  private scene: IScene;
  private communicatior: ICommunicatior;
  private socketServer: ISocketServer;

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
  }
}

const createWSServer = () => {
  const scene = new Scene();
  const communicator = new Communicatior(scene);
  const wsServer = new WSSocketServer(communicator);
  return new Server(wsServer, communicator, scene);
};
