import fs from "fs";
import path from "path";
import { LayoutMetaExt, StageExt } from "@stdTypes/stage";
import { config } from "@server/config";
import { severityLog } from "@server/utils";
import { Communicator } from "@server/game/communicator/communicator";
import { ICommunicator } from "@server/game/communicator/communicatorTypes";
import { smshPropFactory, smshPropMap } from "@server/game/smsh/props";
import { Scene } from "@server/game/scene/scene";
import { IScene } from "@server/game/scene/sceneTypes";
import { WSSocketServer } from "@server/game/sockets/sockets";
import { ISocketServer } from "@server/game/sockets/socketsTypes";
import { SmshScheduler } from "@server/game/smsh/scheduler";

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

export const getWSServer = (port: number) => {
  severityLog(`starting server on port ${port}`);
  const scene = new Scene(
    smshPropMap,
    ["testing", "ascend"],
    { load: getStageFS },
    smshPropFactory,
    new SmshScheduler()
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
