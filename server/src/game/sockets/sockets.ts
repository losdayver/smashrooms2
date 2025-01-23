import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

import { ICommunicator } from "../communicator/communicatorTypes";
import { ISocketServer } from "./socketsTypes";
import {
  IGenericNotRegisteredResponseMessageExt,
  IConnectResponseMessageExt,
  IDisconnectMessageExt,
  IGenericMessageExt,
  IConnectMessageExt,
  IServerChatMessageExt,
  IMessageExt,
  IClientChatMessageExt,
  IClientSceneMetaMessageExt,
  IServerSceneMetaMessageExt,
} from "../../../../types/messages";
import { bufferFromObj, severityLog, wslogSend } from "./../../utils";
import { ClientID } from "../commonTypes";

export class WSSocketServer implements ISocketServer {
  private communicator: ICommunicator;
  private port: number;
  private clientMap: Map<string, IWSClient> = new Map();
  private socketServer: WebSocketServer;
  private maxClients: number;
  private static readonly maxNicknameLength: number = 16;

  constructor(communicator: ICommunicator, port: number, maxClients?: number) {
    this.maxClients = maxClients;
    this.communicator = communicator;
    this.port = port;
    this.init();
  }
  onReceiveMessageFromCommunicator = (
    event: any,
    clientID: ClientID | "all"
  ) => {
    if (clientID == "all") {
      this.sendToAll(JSON.stringify(event));
      return;
    }
    this.clientMap.get(clientID)?.socket.send(JSON.stringify(event));
  };

  private sendToAll = (message: string) => {
    for (const [_, client] of this.clientMap.entries())
      client.socket.send(message);
  };

  private init = () => {
    const sockServer = new WebSocketServer({ port: this.port });
    this.socketServer = sockServer;
    sockServer.on("connection", (clientSocket: WebSocket) => {
      clientSocket.on("message", (buffer: Buffer) => {
        let msg: IMessageExt;
        try {
          msg = JSON.parse(buffer.toString()) as IMessageExt;
          const resolver = this.messageResolveMap[msg.name];
          if (resolver) resolver(clientSocket, msg);
          else this.messageResolveMap["default"](clientSocket, msg);
        } catch (e) {
          severityLog(e as Error);
        }
      });
      clientSocket.on("close", () => this.resolveDisconnect(clientSocket));
    });
  };

  private resolveConnectMessage = (
    clientSocket: WebSocket,
    message: IConnectMessageExt
  ): void => {
    const thresholdA = 2;
    const thresholdB = this.clientRequirementChecks.length;

    for (let i: number = 0; i < thresholdA; i++)
      if (!this.checkClientForRequirement(i, clientSocket, message)) return;
    for (const [_, client] of this.clientMap.entries())
      for (let i: number = thresholdA; i < thresholdB; i++)
        if (!this.checkClientForRequirement(i, clientSocket, message, client))
          return;
    if (!this.checkClientForRequirement(thresholdB - 1, clientSocket, message))
      return;

    const clientID = randomUUID();
    this.clientMap.set(clientID, {
      name: message.clientName,
      socket: clientSocket,
      lastPing: new Date(),
    });
    const connectRes = {
      name: "connRes",
      status: "allowed",
      clientID,
      nameTag: message.clientName,
    } satisfies IConnectResponseMessageExt;
    wslogSend(
      clientSocket,
      connectRes,
      `sockets connected new client ${message.clientName}`
    );
    this.communicator.processMessage(clientID, connectRes);
  };

  private checkClientForRequirement = (
    reqIndex: number,
    clientSocket: WebSocket,
    clientMsg: IConnectMessageExt,
    extraInfo: any = null
  ): boolean => {
    if (
      !this.clientRequirementChecks[reqIndex].successCondition(
        clientSocket,
        clientMsg,
        extraInfo
      )
    ) {
      wslogSend(
        clientSocket,
        {
          name: "connRes",
          status: "restricted",
          cause: this.clientRequirementChecks[reqIndex].restrictionCause,
        } satisfies IConnectResponseMessageExt,
        this.clientRequirementChecks[reqIndex].getLogFailureMsg(
          clientMsg.clientName
        ),
        "warning"
      );
      if (this.clientRequirementChecks[reqIndex].closeSocketAtFailure)
        clientSocket.close();
      return false;
    }
    return true;
  };

  private clientRequirementChecks: clientCheck[] = [
    {
      restrictionCause: "name not provided",
      successCondition: (
        clientSocket: WebSocket,
        msg: IConnectMessageExt
      ): boolean => {
        return msg.clientName ? true : false;
      },
      getLogFailureMsg: () =>
        "sockets rejected client connection. name was not provided",
      closeSocketAtFailure: true,
    },
    {
      restrictionCause: "nickname must fit in 16 characters",
      successCondition: (
        clientSocket: WebSocket,
        msg: IConnectMessageExt
      ): boolean => {
        return msg.clientName.length <= 16;
      },
      getLogFailureMsg: (clientName: string) =>
        `sockets rejected client connection ${clientName} due to nickname length excess`,
      closeSocketAtFailure: true,
    },
    {
      restrictionCause: "already connected",
      successCondition: (
        clientSocket: WebSocket,
        msg: IConnectMessageExt,
        clientFromMap: IWSClient
      ): boolean => {
        if (clientSocket == clientFromMap.socket) return false;
        return true;
      },
      getLogFailureMsg: (clientName: string) =>
        `sockets client ${clientName} is already connected`,
      closeSocketAtFailure: false,
    },
    {
      restrictionCause: "name is already occupied",
      successCondition: (
        clientSocket: WebSocket,
        clientMsg: IConnectMessageExt,
        clientFromMap: IWSClient
      ): boolean => {
        if (clientFromMap.name == clientMsg.clientName) return false;
        return true;
      },
      getLogFailureMsg: (clientName: string) =>
        `sockets rejected client connection ${clientName} due to name already being occupied`,
      closeSocketAtFailure: true,
    },
    {
      restrictionCause: "server is full",
      successCondition: () => {
        return this.clientMap.size < this.maxClients;
      },
      getLogFailureMsg: (clientName: string) =>
        `sockets rejected client connection ${clientName} due server being full`,
      closeSocketAtFailure: true,
    },
  ];

  private resolveDisconnect = (clientSocket: WebSocket) => {
    for (const [clientID, client] of this.clientMap.entries()) {
      if (client.socket == clientSocket) {
        this.communicator.processMessage(clientID, {
          name: "disc",
          clientID,
        } satisfies IDisconnectMessageExt);
        this.clientMap.delete(clientID);
        severityLog(`sockets disconnected client ${clientID} ${client.name}`);
        return;
      }
    }
  };

  private resolveClientChatMessage = (
    clientSocket: WebSocket,
    message: IClientChatMessageExt
  ) => {
    let sender: string;
    for (const [_, client] of this.clientMap.entries())
      if (client.socket == clientSocket) {
        sender = client.name;
        break;
      }
    if (!sender) return;
    const msg: IServerChatMessageExt = {
      name: "serverChat",
      sender,
      message: message.message,
    };
    const stringMsg = JSON.stringify(msg);
    this.sendToAll(stringMsg);
  };

  private resolveGenericMessage = (
    clientSocket: WebSocket,
    message: IGenericMessageExt
  ) => {
    let clientID: ClientID;
    let currentClinet: IWSClient;
    for (const [ID, client] of this.clientMap.entries())
      if (clientSocket == client.socket) {
        currentClinet = client;
        clientID = ID;
        break;
      }

    if (!clientID && !["clientSceneMeta"].includes(message.name)) {
      clientSocket.send(
        bufferFromObj({
          name: "notReg",
        } satisfies IGenericNotRegisteredResponseMessageExt)
      );
      return;
    }

    if (message.name == "clientSceneMeta") {
      const meta = this.communicator.processMessageSync(
        message as IClientSceneMetaMessageExt
      ) as IServerSceneMetaMessageExt;
      meta.maxPlayerCount = this.maxClients ?? "infinite";
      meta.currPlayerCount = this.clientMap.size;
      wslogSend(clientSocket, meta);
    } else
      this.communicator.processMessage(clientID, message, currentClinet?.name);
  };

  private messageResolveMap: Partial<
    Record<
      IMessageExt["name"] | "default",
      (clientSocket: WebSocket, message: any) => void
    >
  > = {
    conn: this.resolveConnectMessage,
    clientChat: this.resolveClientChatMessage,
    default: this.resolveGenericMessage,
  };
}

export interface IWSClient {
  name: string;
  socket: WebSocket;
  lastPing: Date;
}

interface clientCheck {
  successCondition: (
    clientSock: WebSocket,
    clientMsg: IConnectMessageExt,
    extraInfo: any
  ) => boolean;
  restrictionCause: string;
  getLogFailureMsg: (name: string) => string;
  closeSocketAtFailure: boolean;
}
