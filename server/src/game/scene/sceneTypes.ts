import { ClientID, IDestructible } from "@server/game/commonTypes";
import {
  ClientActionStatusExt,
  IGenericMessageExt,
  IServerSceneMetaMessageExt,
  NotificationTypesExt,
} from "@stdTypes/messages";
import { PropBehaviours } from "@server/game/scene/propTypes";
import { RecursivePartial } from "@server/utils";
import { IAnimationExt, ICollidableExt, PropIDExt } from "@stdTypes/sceneTypes";
import { Prop } from "@server/game/scene/prop";
import { StageExt } from "@stdTypes/stage";
import { DBQuerier } from "@server/db/dbQuerier";

export interface IScene extends ISceneActions, IDestructible {
  subscribe: (sceneSubscriber: ISceneSubscriber) => void;
  tick: () => void;
  getSceneMeta: () => Omit<
    IServerSceneMetaMessageExt,
    "currPlayerCount" | "maxPlayerCount"
  >;
  getLayoutAt: (x: number, y: number) => ILayoutTile;
  getLayoutAtNormalized: (x: number, y: number) => ILayoutTile;
  checkLayoutCollision: (prop: ICollidableExt, ignoreSemi?: boolean) => boolean;
  sendNotification: (
    message: string,
    type?: NotificationTypesExt,
    target?: ClientID | "all"
  ) => void;
  produceSound: (sound: string) => void;
  sendArbitraryMessage: (
    message: IGenericMessageExt,
    target: ClientID | "all"
  ) => void;
  getPropByID: (ID: Prop["ID"]) => Prop;
  queryProp: (queryFunc: (prop: Prop) => boolean) => Prop;
  readonly scheduler?: Scheduler;
  readonly tickNum: number;
  readonly querier: DBQuerier;
}

/** This interface represents actions that are turned into scene events in event loop */
export interface ISceneActions {
  clientAction: (
    clientID: string,
    code: string,
    nameTag: string,
    status?: ClientActionStatusExt
  ) => void | Promise<void>;
  connectAction: (clientID: string, nameTag?: string) => void | Promise<void>;
  disconnectAction: (clientID: string) => void | Promise<void>;
  mutatePropBehaviourAction: (
    propOrID: (Prop & PropBehaviours) | PropIDExt,
    behaviour: { name: string; newValue: any }
  ) => void;
  spawnPropAction: (
    propName: string,
    behaviours?: RecursivePartial<PropBehaviours>
  ) => Promise<void>;
  destroyPropAction: (propID: PropIDExt) => Promise<void>;
  animatePropAction: (propID: PropIDExt, name: string) => Promise<void>;
}

export abstract class Scheduler {
  onTick: (tickNum: number) => void;
  init: (scene: IScene, stage?: StageExt) => void;
}

export interface IStageLoader {
  load: (name: string) => StageExt;
}

/** describes event that is put into event queue upon receiving action from outside */
export type IInternalEvent =
  | ISpawnPropEvent
  | ISpawnControlledPropEvent
  | IDestroyPropEvent
  | IDestroyControlledPropEvent
  | IClientActionEvent
  | IAnimatePropEvent;

export interface ISpawnPropEvent {
  name: "spawnProp";
  data: {
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
    type: "connected" | "revive" | "reviveSilent";
    nameTag: string;
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
    ID: PropIDExt;
  };
}

export interface IAnimatePropEvent {
  name: "animateProp";
  data: IAnimationExt;
}

export interface IClientActionEvent {
  name: "clientAction";
  data: {
    clientID: ClientID;
    code: string;
    status?: ClientActionStatusExt;
    nameTag?: string;
  };
}

export interface ISceneSubscriber {
  onReceiveMessageFromScene: (
    message: IGenericMessageExt,
    clientID?: ClientID | "all"
  ) => void;
}

export type IExternalEventBatch = {
  update?: ExternalUpdateBehaviours;
  load?: ExternalLoadChunk[];
  delete?: PropIDExt[];
  anim?: IAnimationExt[];
};

export type ExternalUpdateBehaviours = Record<
  PropIDExt,
  Record<string, PropBehaviours>
>;

export type ExternalLoadChunk = Omit<Prop, "scene"> & PropBehaviours;

export interface ISceneTemplate {
  props?: Prop[];
  layout?: any;
}

export interface ILayoutTile {
  solidity: "solid" | "semi" | "ghost";
}
