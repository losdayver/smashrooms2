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
  ) => {
    for (const [_, client] of this.clientMap.entries()) {
      if (clientSocket == client.socket) {
        wslogSend(
          clientSocket,
          {
            name: "connRes",
            status: "restricted",
            cause: "already connected",
          } satisfies IConnectResponseMessageExt,
          `sockets client ${message.clientName} is already connected`,
          "warning"
        );
        return;
      }
      if (this.clientMap.size >= this.maxClients) {
        wslogSend(
          clientSocket,
          {
            name: "connRes",
            status: "restricted",
            cause: "server is full",
          } satisfies IConnectResponseMessageExt,
          `sockets rejected client connection ${message.clientName} due server being full`,
          "warning"
        );
        clientSocket.close();
        return;
      }
      if (client.name == message.clientName) {
        wslogSend(
          clientSocket,
          {
            name: "connRes",
            status: "restricted",
            cause: "name is already occupied",
          } satisfies IConnectResponseMessageExt,
          `sockets rejected client connection ${message.clientName} due to name already being occupied`,
          "warning"
        );
        clientSocket.close();
        return;
      }
      if (!message.clientName) {
        wslogSend(
          clientSocket,
          {
            name: "connRes",
            status: "restricted",
            cause: "name not provided",
          } satisfies IConnectResponseMessageExt,
          `sockets rejected client connection. name was not provided`,
          "warning"
        );
        clientSocket.close();
        return;
      }
    }

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
