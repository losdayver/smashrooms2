import { ClientActionCodes } from "../sockets/messageMeta";

export interface IScene extends ISceneActions {
  makeSubscribe: (sceneSubscriber: ISceneSubscriber) => void;
  tick: () => void;
}

export interface ISceneActions {
  clientAction: (clientID: ISceneClient["ID"], code: ClientActionCodes) => void;
  connectAction: (clientID: ISceneClient["ID"]) => void;
  disconnectAction: (clientID: ISceneClient["ID"]) => void;
}

export interface ISceneSubscriber {
  handlerForSceneEventsEvents: (
    event: ISceneEvents,
    sceneClientID: ISceneClient["ID"]
  ) => void;
}
export type ISceneEvents = IGetChunks; // разные события, например, необходимость обновить чанки для пользователя
export interface IGetChunks {
  chunkIDs: any[]; // todo implement
}

export interface ISceneClient {
  ID: string;
}
