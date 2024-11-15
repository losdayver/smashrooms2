import { WebSocketServer, WebSocket } from "ws";

import {
  ICommunicatior,
  ICommunicatorClient,
  ICommunicatorEvent,
} from "../communicator/communicatorTypes";
import { ISocketServer } from "./socketsTypes";
import { IConnectionMessage } from "./wsMessageMeta";

export class WSSocketServer implements ISocketServer {
  private communicator: ICommunicatior;
  private port: number;
  private clientMap: ClientMap;
  private socketServer: WebSocketServer;

  constructor(communicator: ICommunicatior, port: number) {
    this.communicator = communicator;
    this.port = port;
    this.init();
  }
  handlerForCommunicatorEvents = (
    event: ICommunicatorEvent,
    clientID: ICommunicatorClient["ID"]
  ) => {
    this.clientMap.get(clientID)?.socket.send(JSON.stringify(event));
  };

  private init = () => {
    const sockServer = new WebSocketServer({ port: this.port });
    this.socketServer = sockServer;
    sockServer.on("connection", (clientSocket) => {
      clientSocket.on("message", (buffer) => {
        let data;
        try {
          data = JSON.parse(buffer.toString()) as IConnectionMessage;
          this.resolveConnectionMessage(clientSocket, data);
        } catch {}
      });
    });
  };

  private resolveConnectionMessage = (
    clientSocket: WebSocket,
    message: IConnectionMessage
  ) => {};
  private resolveGenericMessage = () => {};
}

type ClientMap = Map<string, IWSClient>;

export interface IWSClient {
  socket: WebSocket;
  lastPing: Date;
}
