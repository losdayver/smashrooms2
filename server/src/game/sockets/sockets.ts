import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

import { ICommunicatior } from "../communicator/communicatorTypes";
import { ISocketServer } from "./socketsTypes";
import {
  IGenericNotRegisteredResponseMessageExt,
  IConnectResponseMessageExt,
  IDisconnectMessageExt,
  IGenericMessageExt,
  IConnectMessageExt,
  IServerChatMessageExt,
} from "../../../../types/messages";
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
  handlerForCommunicatorEvents = (event: any, clientID: ClientID | "all") => {
    console.log(event);
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
    sockServer.on("connection", (clientSocket) => {
      clientSocket.on("message", (buffer) => {
        let msg;
        try {
          msg = JSON.parse(buffer.toString()) as any;
          if (msg.name == "conn") {
            this.resolveConnectMessage(clientSocket, msg);
          } else if (msg.name == "clientChat") {
            // todo handler map
            let senderName: string;
            for (const [_, client] of this.clientMap.entries())
              if (client.socket == clientSocket) {
                senderName = client.name;
                break;
              }
            if (senderName)
              this.resolveClientChatMessage(senderName, msg.message);
          } else if (msg.name == "clientSceneMeta") {
            const data = this.communicator.processMessageSync(msg);
            wslogSend(clientSocket, data);
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
    this.communicator.processMessage(connectRes);
  };

  private resolveDisconnect = (clientSocket: WebSocket) => {
    for (const [clientID, client] of this.clientMap.entries()) {
      if (client.socket == clientSocket) {
        this.communicator.processMessage({
          name: "disc",
          clientID,
        } satisfies IDisconnectMessageExt);
        this.clientMap.delete(clientID);
        severityLog(`sockets disconnected client ${clientID} ${client.name}`);
        return;
      }
    }
  };

  private resolveClientChatMessage = (sender: string, message: string) => {
    const msg: IServerChatMessageExt = {
      name: "serverChat",
      sender,
      message,
    };
    const stringMsg = JSON.stringify(msg);
    this.sendToAll(stringMsg);
  };

  private resolveGenericMessage = (
    clientSocket: WebSocket,
    message: IGenericMessageExt
  ) => {
    if (!this.clientMap.has(message.clientID)) {
      clientSocket.send(
        bufferFromObj({
          name: "notReg",
        } satisfies IGenericNotRegisteredResponseMessageExt)
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
