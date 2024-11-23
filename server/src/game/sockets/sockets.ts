import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

import {
  ICommunicatior,
  ICommunicatorEvent,
} from "../communicator/communicatorTypes";
import { ISocketServer } from "./socketsTypes";
import {
  IConnectMessage,
  IConnectResponseMessage,
  IDisconnectMessage,
  IGenericMessage,
  IGenericNotRegisteredResponseMessage,
} from "./messageMeta";
import { bufferFromObj, severityLog, wslogSend } from "./../../utils";
import { ClientID } from "../commonTypes";

export class WSSocketServer implements ISocketServer {
  private communicator: ICommunicatior;
  private port: number;
  private clientMap: ClientMap = new Map();
  private socketServer: WebSocketServer;

  constructor(communicator: ICommunicatior, port: number) {
    this.communicator = communicator;
    this.port = port;
    this.init();
  }
  handlerForCommunicatorEvents = (
    event: ICommunicatorEvent,
    clientID: ClientID
  ) => {
    this.clientMap.get(clientID)?.socket.send(JSON.stringify(event));
  };

  private init = () => {
    const sockServer = new WebSocketServer({ port: this.port });
    this.socketServer = sockServer;
    sockServer.on("connection", (clientSocket) => {
      clientSocket.on("message", (buffer) => {
        let msg;
        try {
          msg = JSON.parse(buffer.toString()) as any;
          if (msg.name == "conn") {
            this.resolveConnectMessage(clientSocket, msg);
          } else this.resolveGenericMessage(clientSocket, msg);
        } catch (e) {
          severityLog(e as Error);
        }
      });
      clientSocket.on("close", () => this.resolveDisconnect(clientSocket));
    });
  };

  private resolveConnectMessage = (
    clientSocket: WebSocket,
    message: IConnectMessage
  ) => {
    for (const [_, client] of this.clientMap.entries()) {
      if (clientSocket == client.socket) {
        wslogSend(
          clientSocket,
          {
            name: "connRes",
            status: "restricted",
            cause: "already connected",
          } satisfies IConnectResponseMessage,
          `sockets client ${message.clientName} is already connected`,
          "warning"
        );
        return;
      }
      if (client.name == message.clientName) {
        wslogSend(
          clientSocket,
          {
            name: "connRes",
            status: "restricted",
            cause: "name is already occupied",
          } satisfies IConnectResponseMessage,
          `sockets rejected client connection ${message.clientName} due to name already being occupied`,
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
    } satisfies IConnectResponseMessage;
    wslogSend(
      clientSocket,
      connectRes,
      `sockets connected new client ${message.clientName}`
    );
    this.communicator.processMessage(connectRes);
  };

  private resolveDisconnect = (clientSocket: WebSocket) => {
    for (const [clientID, client] of this.clientMap.entries()) {
      if (client.socket == clientSocket) {
        this.communicator.processMessage({
          name: "disc",
          clientID,
        } satisfies IDisconnectMessage);
        this.clientMap.delete(clientID);
        severityLog(`sockets disconnected client ${clientID} ${client.name}`);
        return;
      }
    }
  };

  private resolveGenericMessage = (
    clientSocket: WebSocket,
    message: IGenericMessage
  ) => {
    if (!this.clientMap.has(message.clientID)) {
      clientSocket.send(
        bufferFromObj({
          name: "notReg",
        } satisfies IGenericNotRegisteredResponseMessage)
      );
      return;
    }
    this.communicator.processMessage(message);
  };
}

type ClientMap = Map<string, IWSClient>;

export interface IWSClient {
  name: string;
  socket: WebSocket;
  lastPing: Date;
}
