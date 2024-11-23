export interface IConnectMessage {
  name: "conn";
  clientName: string;
}
export interface IConnectResponseMessage {
  name: "connRes";
  status: "allowed" | "restricted";
  cause?: string;
  clientID?: string;
}

export interface IDisconnectMessage {
  name: "disc";
  clientID: string;
}
export interface IGenericNotRegisteredResponseMessage {
  name: "notReg";
}

export interface IGenericMessage {
  name: string;
  clientID: string;
  data: any;
}
export interface IClientActionMessage extends IGenericMessage {
  name: "clientAct";
  data: {
    code: ClientActionCodes;
  };
}
export type ClientActionCodes = "left" | "right" | "jump" | "fire" | "duck";
export type ClientActionStatus = "pressed" | "released";
export interface IGenericResponseMessage {
  data: any;
}
