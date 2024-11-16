import { ISceneSubscriber } from "../scene/sceneTypes";
import {
  ClientActionCodes,
  IClientActionMessage,
  IConnectMessage,
  IConnectResponseMessage,
  IDisconnectMessage,
  IGenericMessage,
} from "../sockets/messageMeta";

export interface ICommunicatior extends ISceneSubscriber {
  processMessage: (
    msg:
      | IConnectResponseMessage
      | IDisconnectMessage
      | IClientActionMessage
      | IGenericMessage
  ) => void;
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
    clientID: ICommunicatorClient["ID"];
  };
}
export interface IClientSceneActionRequest {
  name: "clientSceneActionReq";
  body: {
    code: ClientActionCodes;
  };
}
export interface IClientSceneMessageRequest {
  name: "clientMsgReq";
  body: {
    message: string;
  };
}

export interface ICommunicatorClient {
  ID: string;
}

export interface ICommunicatorSubscriber {
  handlerForCommunicatorEvents: (
    event: ICommunicatorEvent,
    sceneClientID: ICommunicatorClient["ID"]
  ) => void;
}

export type ICommunicatorEvent = any;
