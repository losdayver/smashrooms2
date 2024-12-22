import { ClientID } from "../commonTypes";
import { ISceneSubscriber } from "../scene/sceneTypes";
import {
  IClientActionMessageExt,
  IConnectResponseMessageExt,
  IDisconnectMessageExt,
  IGenericMessageExt,
  ClientActionCodesExt,
  IClientSceneMetaMessageExt,
  IMessageExt,
} from "../../../../types/messages";

export interface ICommunicator extends ISceneSubscriber {
  processMessage: (
    from: ClientID,
    msg:
      | IConnectResponseMessageExt
      | IDisconnectMessageExt
      | IClientActionMessageExt
      | IGenericMessageExt
      | IClientSceneMetaMessageExt
  ) => void;
  processMessageSync: (msg: IClientSceneMetaMessageExt) => any;
  subscribe: (communicatorSubscriber: ICommunicatorSubscriber) => void;
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
  onReceiveMessageFromCommunicator: (
    message: IMessageExt,
    clientID?: ClientID | "all"
  ) => void;
}
