import path from "path";
import fsp from "node:fs/promises";
import express from "express";
import { env } from "@server/env";
import {
  IEditorUploadIncomingBody,
  IEditorUploadOutgoingBody,
} from "@stdTypes/apiTypes";
import { config } from "@server/config";
import { getWSServer, Server } from "./server";
import { StageExt } from "@stdTypes/stage";

const corsMiddleware = (
  req: express.Request,
  res: express.Response,
  next: () => void
) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
};

const getStageBase64 = async (
  stageName: string,
  fileType: "layout" | "meta"
) => {
  let data: Buffer;
  try {
    data = await fsp.readFile(
      path.join(
        config.stagesRoute,
        stageName,
        `${stageName}${fileType == "layout" ? ".layout" : ".meta.json"}`
      )
    );
  } catch {
    throw new Error();
  }
  return data.toString("base64");
};

const saveStage = async (stageBody: IEditorUploadIncomingBody) => {
  const base64Decode = (text: string) =>
    Buffer.from(text, "base64").toString("utf8");
  const data = stageBody;
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
  } catch {
    throw new Error();
  }
  await fsp.mkdir(stage.meta.stageSystemName, { recursive: true });
  await Promise.all([
    fsp.writeFile(
      path.join(stagePath, `${stageName}.layout`),
      layoutDataString
    ),
    fsp.writeFile(path.join(stagePath, `${stageName}.meta.json`), metaString),
  ]);
  return stage;
};

export const startApi = () => {
  const api = express();
  api.use(express.json());
  api.use(corsMiddleware);

  if (env.editorConfig?.allow) {
    let editorWSServer: Server;
    api.get("/editor/stageNames", async (_, res) => {
      const folders = await fsp
        .readdir(config.stagesRoute, { withFileTypes: true })
        .then((files) =>
          files.filter((d) => d.isDirectory()).map((d) => d.name)
        );
      res.setHeader("Content-Type", "application/json");
      res.send(folders);
    });
    api.get("/editor/load/layout/:stageName", async (req, res) => {
      res.setHeader("Content-Type", "text/plain");
      res.send(await getStageBase64(req.params.stageName, "layout"));
    });
    api.get("/editor/load/meta/:stageName", async (req, res) => {
      res.setHeader("Content-Type", "text/plain");
      res.send(await getStageBase64(req.params.stageName, "meta"));
    });
    api.post("/editor/save", async (req, res) => {
      try {
        await saveStage(req.body as IEditorUploadIncomingBody);
      } catch {
        res.send(400);
      }
      res.send();
    });
    api.post("/editor/upload", async (req, res) => {
      if (editorWSServer) editorWSServer.stop();
      let stage: StageExt;
      try {
        stage = await saveStage(req.body as IEditorUploadIncomingBody);
      } catch {
        res.send(400);
      }
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
  api.listen(env.apiConfig.port ?? 5900, "0.0.0.0", () => {
    console.log(`api server listening on port ${env.apiConfig.port ?? 5900}!`);
  });
};
