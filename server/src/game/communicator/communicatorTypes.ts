import { ClientID } from "@server/game/commonTypes";
import { ISceneSubscriber } from "@server/game/scene/sceneTypes";
import {
  IClientActionMessageExt,
  IConnectResponseMessageExt,
  IDisconnectMessageExt,
  IGenericMessageExt,
  ClientActionCodesExt,
  IClientSceneMetaMessageExt,
  IWebDBQuery,
} from "@stdTypes/messages";

export interface ICommunicator extends ISceneSubscriber {
  processMessage: (
    from: ClientID,
    msg:
      | IConnectResponseMessageExt
      | IDisconnectMessageExt
      | IClientActionMessageExt
      | IGenericMessageExt
      | IClientSceneMetaMessageExt,
    clientName?: string
  ) => void;
  processMessageWithResponse: (
    msg: IClientSceneMetaMessageExt | IWebDBQuery
  ) => Promise<any>;
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
    message: IGenericMessageExt,
    clientID?: ClientID | "all"
  ) => void;
}
