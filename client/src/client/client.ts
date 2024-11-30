import { ClientActionCodesExt, IMessageExt } from "../../../types/messages";
import { IExternalEvent, PropIDExt } from "../../../types/sceneTypes";

export class Client {
  private socket: WebSocket;
  private ID: PropIDExt;
  private connString: string;

  private onConnect: (success: boolean) => void;
  private onSceneEvent: (data: IExternalEvent) => void;

  connectByClientName = (clientName: string) => {
    this.socket.send(
      JSON.stringify({
        name: "conn",
        clientName: clientName,
      })
    );
  };

  sendInput = (code: ClientActionCodesExt) => {
    this.socket.send(
      JSON.stringify({
        name: "clientAct",
        clientID: this.ID,
        data: {
          code,
          status: "pressed",
        },
      })
    );
  };

  onmessage = (message: MessageEvent<string>) => {
    let parsedMsg: IMessageExt;
    try {
      parsedMsg = JSON.parse(message.data);
    } catch {
      return; // todo: error handling
    }

    if (parsedMsg.name == "connRes") {
      if (parsedMsg.status == "allowed") {
        this.ID = parsedMsg.clientID;
        this.onConnect?.(true);
      } else this.onConnect?.(false);
    } else if (parsedMsg.name == "scene") {
      this.onSceneEvent?.(parsedMsg.data);
    }
  };

  init = (
    onConnect?: (status: boolean) => void,
    onSceneEvent?: (data: IExternalEvent) => void
  ) => {
    this.onConnect = onConnect;
    this.onSceneEvent = onSceneEvent;
    this.socket = new WebSocket(this.connString);
    this.socket.onmessage = this.onmessage;
  };

  constructor(connString: string) {
    this.connString = connString;
  }
}
