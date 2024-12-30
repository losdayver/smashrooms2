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
  stageSystemName: LayoutMetaExt["stageSystemName"];
  gridSize: LayoutMetaExt["gridSize"];
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
  | "warning"
  | "connected"
  | "disconnected"
  | "music";

export interface IGenericMessageExt {
  name: string;
  data: any;
}

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
  | IServerNotificationExt;

export interface IClientActionMessageExt extends IGenericMessageExt {
  name: "clientAct";
  data: {
    code: ClientActionCodesExt;
    status: ClientActionStatusExt;
  };
}
export type ClientActionCodesExt = "left" | "right" | "jump" | "fire" | "duck";
export type ClientActionStatusExt = "pressed" | "released";
