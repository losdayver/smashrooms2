import fs from "fs";
import fsp from "node:fs/promises";
import path from "path";
import { LayoutMetaExt, StageExt } from "@stdTypes/stage";
import { config } from "@server/config";
import { severityLog } from "@server/utils";
import { Communicator } from "@server/game/communicator/communicator";
import { ICommunicator } from "@server/game/communicator/communicatorTypes";
import { smshPropFactory, smshPropMap } from "@server/game/smsh/props";
import { Scene } from "@server/game/scene/scene";
import { IScene, IStageLoader } from "@server/game/scene/sceneTypes";
import { WSSocketServer } from "@server/game/sockets/sockets";
import { ISocketServer } from "@server/game/sockets/socketsTypes";
import { SmshScheduler } from "@server/game/smsh/scheduler";
import { PGQuerier } from "@server/db/pgQuerier";
import express from "express";
import { env } from "@server/env";
import {
  IEditorUploadIncomingBody,
  IEditorUploadOutgoingBody,
} from "@stdTypes/apiTypes";

export class Server {
  private scene: IScene;
  private communicator: ICommunicator;
  private socketServer: ISocketServer;
  private interval: NodeJS.Timeout;

  start = () => (this.interval = setInterval(this.scene.tick, 32));

  stop = () => {
    clearTimeout(this.interval);
    this.scene.destructor();
    this.socketServer.destructor();
  };

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

export const getWSServer = (
  port: number,
  custom?: { stages?: string[]; stageLoader?: IStageLoader }
) => {
  const pgQuerier = new PGQuerier();

  severityLog(`starting server on port ${port}`);
  const scene = new Scene(
    smshPropMap,
    custom?.stages ?? ["instagib", "ascend", "origins"],
    custom?.stageLoader ?? { load: getStageFS },
    smshPropFactory,
    new SmshScheduler(),
    pgQuerier
  );
  const communicator = new Communicator(scene, pgQuerier);
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

export const startApi = () => {
  const api = express();
  api.use(express.json());

  if (env.editorConfig?.allow) {
    let editorWSServer: Server;

    api.options("/{*any}", (req, res) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.send();
    });
    api.post("/editor/upload", async (req, res) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.header("Access-Control-Allow-Credentials", "true");

      if (editorWSServer) editorWSServer.stop();

      const base64Decode = (text: string) =>
        Buffer.from(text, "base64").toString("utf8");

      const data = req.body as IEditorUploadIncomingBody;
      const metaString = base64Decode(data.meta);
      const layoutDataString = base64Decode(data.layoutData);
      const stage: StageExt = {
        layoutData: base64Decode(data.layoutData) as StageExt["layoutData"],
        meta: JSON.parse(metaString) as StageExt["meta"],
      };
      const stageName = stage.meta.stageSystemName;

      const stagePath = path.resolve(
        config.stagesRoute,
        stage.meta.stageSystemName
      );
      try {
        await fsp.rm(stagePath, { recursive: true, force: true });
        await fsp.mkdir(stagePath, { recursive: true });
      } catch {}
      await fsp.mkdir(stage.meta.stageSystemName, { recursive: true });
      await Promise.all([
        fsp.writeFile(
          path.join(stagePath, `${stageName}.layout`),
          layoutDataString
        ),
        fsp.writeFile(
          path.join(stagePath, `${stageName}.meta.json`),
          metaString
        ),
      ]);

      editorWSServer = getWSServer(env.editorConfig.testingServerPort, {
        stages: [stage.meta.stageSystemName],
        stageLoader: { load: () => stage },
      });
      editorWSServer.start();
      res.send({
        testingUrlParams: `?wsPort=${env.editorConfig.testingServerPort}`,
      } satisfies IEditorUploadOutgoingBody);
    });
  }
  api.listen(5900, "0.0.0.0", () => {
    console.log(`api server listening on port ${5900}!`);
  });
};
