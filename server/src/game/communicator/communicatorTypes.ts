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

export interface ICommunicatior extends ISceneSubscriber {
  processMessage: (
    from: ClientID,
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
    event: any,
    cleintID: ClientID | "all",
    messageName?: IMessageExt["name"]
  ) => void;
}
