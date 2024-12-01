import {
  ClientActionCodesExt,
  ClientActionStatusExt,
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

  connectByClientName = (clientName: string) => {
    this.socket.send(
      JSON.stringify({
        name: "conn",
        clientName: clientName,
      })
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
      })
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
    }
  };

  constructor(connString: string) {
    this.connString = connString;
    this.socket = new WebSocket(this.connString);
    this.socket.onmessage = this.onmessage;
  }
}
