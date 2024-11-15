import { ClientActionCodes, ISceneSubscriber } from "../scene/sceneTypes";

export interface ICommunicatior extends ISceneSubscriber {
  processRequest: (request: ICommunicatorRequests) => void;
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
