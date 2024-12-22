import { ClientID } from "../commonTypes";
import {
  ClientActionCodesExt,
  ClientActionStatusExt,
  IMessageExt,
  IServerSceneMetaMessageExt,
  NotificationTypesExt,
} from "../../../../types/messages";
import { IProp, PropBehaviours } from "./propTypes";
import { RecursivePartial } from "../../utils";
import { ICollidableExt, PropIDExt } from "../../../../types/sceneTypes";

export interface IScene extends ISceneActions {
  subscribe: (sceneSubscriber: ISceneSubscriber) => void;
  tick: () => void;
  getSceneMeta: () => IServerSceneMetaMessageExt;
  getLayoutAt: (x: number, y: number) => ILayoutTile;
  getLayoutAtNormalized: (x: number, y: number) => ILayoutTile;
  checkLayoutCollision: (prop: ICollidableExt, ignoreSemi?: boolean) => boolean;
  sendNotification: (
    message: string,
    type?: NotificationTypesExt,
    target?: ClientID | "all"
  ) => void;
}

export interface ISceneActions {
  clientAction: (
    clientID: string,
    code: ClientActionCodesExt,
    status?: ClientActionStatusExt
  ) => void | Promise<void>;
  connectAction: (clientID: string, nameTag?: string) => void | Promise<void>;
  disconnectAction: (clientID: string) => void | Promise<void>;
  mutatePropBehaviourAction: (
    propOrID: (IProp & PropBehaviours) | string,
    behaviour: { name: string; newValue: any }
  ) => void;
  spawnPropAction: (
    propName: string,
    behaviours?: RecursivePartial<PropBehaviours>
  ) => Promise<void>;
  destroyPropAction: (propID: PropIDExt) => Promise<void>;
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
    behaviours?: RecursivePartial<PropBehaviours>;
  };
}
export interface ISpawnControlledPropEvent {
  name: "spawnControlledProp";
  data: {
    posX: number;
    posY: number;
    propName: string;
    clientID: ClientID;
    nameTag?: string;
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
    code: ClientActionCodesExt;
    status?: ClientActionStatusExt;
  };
}

export interface ISceneSubscriber {
  onReceiveMessageFromScene: (
    message: IMessageExt,
    clientID?: ClientID | "all"
  ) => void;
}

export type IExternalEventBatch = {
  update?: ExternalUpdateBehaviours;
  load?: ExternalLoadChunk[];
  delete?: PropIDExt[];
};

export type ExternalUpdateBehaviours = Record<
  PropIDExt,
  Record<string, PropBehaviours>
>;

export type ExternalLoadChunk = Omit<IProp, "scene"> & PropBehaviours;

export interface ISceneTemplate {
  props?: IProp[];
  layout?: any;
}

export interface ILayoutTile {
  solidity: "solid" | "semi" | "ghost";
}
