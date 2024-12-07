import { ClientID } from "../commonTypes";
import { ISceneSubscriber } from "../scene/sceneTypes";
import {
  IClientActionMessageExt,
  IConnectResponseMessageExt,
  IDisconnectMessageExt,
  IGenericMessageExt,
  ClientActionCodesExt,
  IClientSceneMetaMessageExt,
} from "../../../../types/messages";

export interface ICommunicatior extends ISceneSubscriber {
  processMessage: (
    msg:
      | IConnectResponseMessageExt
      | IDisconnectMessageExt
      | IClientActionMessageExt
      | IGenericMessageExt
  ) => void;
  processMessageSync: (msg: IClientSceneMetaMessageExt) => any;
  makeSubscribe: (communiucatorSubscriber: ICommunicatorSubscriber) => void;
}

export type ICommunicatorRequests =
  | IConnectionRequest
  | IDisconnectionRequest
  | IClientSceneActionRequest
  | IClientSceneMessageRequest;
export interface IConnectionRequest {
  name: "connectionReq";
}
export interface IDisconnectionRequest {
  name: "disconnectionReq";
  body: {
    clientID: ClientID;
  };
}
export interface IClientSceneActionRequest {
  name: "clientSceneActionReq";
  body: {
    code: ClientActionCodesExt;
  };
}
export interface IClientSceneMessageRequest {
  name: "clientMsgReq";
  body: {
    message: string;
  };
}

export interface ICommunicatorSubscriber {
  handlerForCommunicatorEvents: (
    event: ICommunicatorEvent,
    cleintID: ClientID | "all"
  ) => void;
}

export type ICommunicatorEvent = any;
