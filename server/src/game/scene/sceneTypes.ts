import { ClientID } from "../commonTypes";
import { ClientActionCodes, ClientActionStatus } from "../sockets/messageMeta";
import { IProp, PropBehaviours } from "./propTypes";

export type PropID = ClientID;

export interface IScene extends ISceneActions {
  makeSubscribe: (sceneSubscriber: ISceneSubscriber) => void;
  tick: () => void;
}

export interface ISceneActions {
  clientAction: (
    clientID: string,
    code: ClientActionCodes,
    status?: ClientActionStatus
  ) => void | Promise<void>;
  connectAction: (clientID: string) => void | Promise<void>;
  disconnectAction: (clientID: string) => void | Promise<void>;
  mutatePropBehaviourAction: (
    propOrID: (IProp & PropBehaviours) | string,
    behaviour: { name: string; newValue: PropBehaviours }
  ) => void;
}

/** describes event that is put into event queue upon receiving action from outside */
export type IInternalEvent =
  | ISpawnPropEvent
  | ISpawnControlledPropEvent
  | IDestroyPropEvent
  | IDestroyControlledPropEvent
  | IClientActionEvent;
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
    clientID: ClientID;
  };
}
export interface IDestroyControlledPropEvent {
  name: "destroyControlledProp";
  data: {
    clientID: ClientID;
  };
}
export interface IDestroyPropEvent {
  name: "destroyProp";
  data: {
    ID: string;
  };
}
export interface IClientActionEvent {
  name: "clientAction";
  data: {
    clientID: ClientID;
    code: ClientActionCodes;
    status?: ClientActionStatus;
  };
}

export interface ISceneSubscriber {
  handlerForSceneExternalEvents: (
    event: IExternalEvent,
    clientID: ClientID | "all"
  ) => void;
}

export type IExternalEvent = {
  update?: ExternalUpdateBehaviours;
  load?: ExternalLoadChunk[];
  delete?: string[];
};

export type ExternalUpdateBehaviours = Record<PropID, PropBehaviours>;

export type ExternalLoadChunk = Omit<IProp, "scene"> & PropBehaviours;

export interface ISceneTemplate {
  props?: IProp[];
  layout?: any;
}
