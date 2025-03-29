/**
 * @file contains types for messages that are exchanged between server and client
 * @author Zhmelev Oleg
 */
import { LayoutMetaExt } from "./stage";
import { ISceneUpdatesMessageData } from "./sceneTypes";

export interface IConnectMessageExt {
  name: "conn";
  clientName: string;
}
export interface IConnectResponseMessageExt {
  name: "connRes";
  status: "allowed" | "restricted";
  cause?: string;
  clientID?: string;
  nameTag?: string;
}

export interface IDisconnectMessageExt {
  name: "disc";
  clientID: string;
}

export interface IGenericNotRegisteredResponseMessageExt {
  name: "notReg";
}

export interface ISceneUpdatesMessageExt {
  name: "scene";
  data: ISceneUpdatesMessageData;
}

export interface IClientSceneMetaMessageExt {
  name: "clientSceneMeta";
}

export interface IServerSceneMetaMessageExt {
  name: "serverSceneMeta";
  stageName: LayoutMetaExt["stageName"];
  stageSystemName: LayoutMetaExt["stageSystemName"];
  stageAuthor: LayoutMetaExt["author"];
  gridSize: LayoutMetaExt["gridSize"];
  currPlayerCount: number;
  maxPlayerCount: number | "infinite";
}

export interface IClientChatMessageExt {
  name: "clientChat";
  message: string;
}

export interface IServerChatMessageExt {
  name: "serverChat";
  sender: string;
  message: string;
}

export interface IServerNotificationExt {
  name: "serverNotify";
  message: string;
  type?: NotificationTypesExt;
}
export type NotificationTypesExt =
  | "info"
  | "danger"
  | "warning"
  | "connected"
  | "disconnected"
  | "music"
  | "dead"
  | "revive";

export interface ISoundMessageExt {
  name: "sound";
  sound: string;
}

export interface IStageChangeExt {
  name: "stageChange";
  status: "showScore" | "reloadStage";
}

/** This interface represents an abstract message */
export interface IGenericMessageExt {
  name: string;
  [key: string]: any;
}

/** This interface represents all the possible messages */
export type IMessageExt =
  | IConnectMessageExt
  | IConnectResponseMessageExt
  | IDisconnectMessageExt
  | IGenericNotRegisteredResponseMessageExt
  | ISceneUpdatesMessageExt
  | IClientChatMessageExt
  | IServerChatMessageExt
  | IServerSceneMetaMessageExt
  | IClientSceneMetaMessageExt
  | IServerNotificationExt
  | ISoundMessageExt
  | IStageChangeExt;

export interface IClientActionMessageExt extends IGenericMessageExt {
  name: "clientAct";
  data: {
    code: ClientActionCodesExt;
    status: ClientActionStatusExt;
  };
}
export type ClientActionCodesExt =
  | "left"
  | "right"
  | "jump"
  | "fire"
  | "duck"
  | "revive"
  | "reviveSilent"
  | "swap";
export type ClientActionStatusExt = "pressed" | "released";
