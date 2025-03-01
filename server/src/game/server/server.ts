import { LayoutMetaExt, StageExt } from "../../../../types/stage";
import { config } from "../../config";
import { severityLog } from "../../utils";
import { Communicator } from "../communicator/communicator";
import { ICommunicator } from "../communicator/communicatorTypes";
import { smshPropFactory, smshPropMap } from "../smsh/props";
import { Scene } from "../scene/scene";
import { IScene } from "../scene/sceneTypes";
import { WSSocketServer } from "../sockets/sockets";
import { ISocketServer } from "../sockets/socketsTypes";
import fs from "fs";
import path from "path";
import { SmshThinker } from "../smsh/thinker";

export class Server {
  private scene: IScene;
  private communicator: ICommunicator;
  private socketServer: ISocketServer;

  start = () => setInterval(this.scene.tick, 32);

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

export const getWSTestingServer = (port: number) => {
  severityLog(`starting server on port ${port}`);
  const stage = getStageFS("ascend");
  const scene = new Scene(
    smshPropMap,
    stage,
    smshPropFactory,
    new SmshThinker(stage)
  );
  const communicator = new Communicator(scene);
  const wsServer = new WSSocketServer(communicator, port, 50);
  return new Server(wsServer, communicator, scene);
};

export const getStageFS = (name: string): StageExt => ({
  layoutData: fs
    .readFileSync(path.resolve(config.stagesRoute, name, `${name}.layout`))
    .toString(),
  meta: JSON.parse(
    fs
      .readFileSync(path.resolve(config.stagesRoute, name, `${name}.meta.json`))
      .toString()
  ) as LayoutMetaExt,
});
