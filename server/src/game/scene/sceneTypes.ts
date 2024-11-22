import { ClientActionCodes } from "../sockets/messageMeta";
import { IProp, PropBehaviours } from "./propTypes";

export interface IScene extends ISceneActions {
  makeSubscribe: (sceneSubscriber: ISceneSubscriber) => void;
  tick: () => void;
}

export interface ISceneActions {
  clientAction: (
    clientID: string,
    code: ClientActionCodes
  ) => void | Promise<void>;
  connectAction: (clientID: string) => void | Promise<void>;
  disconnectAction: (clientID: string) => void | Promise<void>;
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
  handlerForSceneExternalEvents: (
    event: IExternalEvent,
    sceneClientID: string
  ) => void;
}

export type IExternalEvent = {
  clientID: string;
  update: IChunk[];
  load: IChunk[];
};

export interface IChunk {
  props: (IProp & PropBehaviours)[];
}

export interface ISceneTemplate {
  props?: IProp[];
  layout?: any;
}
