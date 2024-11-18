import { ClientActionCodes } from "../sockets/messageMeta";

export interface IScene extends ISceneActions {
  makeSubscribe: (sceneSubscriber: ISceneSubscriber) => void;
  tick: () => void;
}

export interface ISceneActions {
  clientAction: (
    clientID: ISceneClient["ID"],
    code: ClientActionCodes
  ) => void | Promise<void>;
  connectAction: (clientID: ISceneClient["ID"]) => void | Promise<void>;
  disconnectAction: (clientID: ISceneClient["ID"]) => void | Promise<void>;
}

/** describes event that is put into event queue upon receiving action from outside */
export type IInternalEvent =
  | ISpawnPropEvent
  | ISpawnControlledPropEvent
  | IDestroyPropEvent
  | IDestroyControlledPropEvent;
export interface ISpawnPropEvent {
  name: "spawnProp";
  data: {
    posX: number;
    posY: number;
    propName: string;
  };
}
export interface ISpawnControlledPropEvent {
  name: "spawnControlledProp";
  data: {
    posX: number;
    posY: number;
    propName: string;
    clientID: string;
  };
}
export interface IDestroyControlledPropEvent {
  name: "destroyControlledProp";
  data: {
    clientID: string;
  };
}
export interface IDestroyPropEvent {
  name: "destroyProp";
  data: {
    ID: string;
  };
}

export interface ISceneSubscriber {
  handlerForSceneEventsEvents: (
    event: IExternalEvents,
    sceneClientID: ISceneClient["ID"]
  ) => void;
}

export type IExternalEvents = IGetChunks; // разные события, например, необходимость обновить чанки для пользователя
export interface IGetChunks {
  chunkIDs: any[]; // todo implement
}

export interface ISceneClient {
  ID: string;
}
