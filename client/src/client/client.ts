import {
  ClientActionCodesExt,
  ClientActionStatusExt,
  IClientChatMessageExt,
  IClientActionMessageExt,
  IConnectMessageExt,
  IMessageExt,
} from "../../../types/messages";
import { IExternalEvent, PropIDExt } from "../../../types/sceneTypes";

export class Client {
  private socket: WebSocket;
  private ID: PropIDExt;
  private connString: string;

  onConnectHandlers: Record<string, (status: boolean) => void | Promise<void>> =
    {};
  onSceneEventHandlers: Record<
    string,
    (data: IExternalEvent) => void | Promise<void>
  > = {};
  onChatEventHandlers: Record<
    string,
    (sender: string, message: string) => void | Promise<void>
  > = {};

  connectByClientName = (clientName: string) => {
    this.socket.send(
      JSON.stringify({
        name: "conn",
        clientName: clientName,
      } satisfies IConnectMessageExt)
    );
  };

  sendInput = (code: ClientActionCodesExt, status: ClientActionStatusExt) => {
    this.socket.send(
      JSON.stringify({
        name: "clientAct",
        clientID: this.ID,
        data: {
          code,
          status,
        },
      } satisfies IClientActionMessageExt)
    );
  };

  sendChatMessage = (message: string) => {
    this.socket.send(
      JSON.stringify({
        name: "clientChat",
        message,
      } satisfies IClientChatMessageExt)
    );
  };

  onmessage = async (message: MessageEvent<string>) => {
    let parsedMsg: IMessageExt;
    try {
      parsedMsg = JSON.parse(message.data);
    } catch {
      return; // todo: error handling
    }

    if (parsedMsg.name == "connRes") {
      // todo handler map
      if (parsedMsg.status == "allowed") {
        this.ID = parsedMsg.clientID;
        Promise.all(
          Object.values(this.onConnectHandlers).map(
            async (callback) => await callback(true)
          )
        );
      } else
        Promise.all(
          Object.values(this.onConnectHandlers).map(
            async (callback) => await callback(false)
          )
        );
    } else if (parsedMsg.name == "scene") {
      Promise.all(
        Object.values(this.onSceneEventHandlers).map(
          async (callback) => await callback(parsedMsg.data)
        )
      );
    } else if (parsedMsg.name == "serverChat") {
      Promise.all(
        Object.values(this.onChatEventHandlers).map(
          async (callback) =>
            await callback(parsedMsg.sender, parsedMsg.message)
        )
      );
    }
  };

  constructor(connString: string) {
    this.connString = connString;
    this.socket = new WebSocket(this.connString);
    this.socket.onmessage = this.onmessage;
  }
}
