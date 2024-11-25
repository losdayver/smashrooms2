export class Client {
  private socket: WebSocket;
  private ID: string;
  private connString: string;

  private onConnect: (success: boolean) => void;
  private onSceneEvent: (data: any) => void;

  connectByClientName = (clientName: string) => {
    this.socket.send(
      JSON.stringify({
        name: "conn",
        clientName: clientName,
      })
    );
  };

  onmessage = (message: MessageEvent) => {
    let parsedMsg: Message;
    try {
      parsedMsg = JSON.parse(message.data);
    } catch {
      return;
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
    onSceneEvent?: (data: any) => void
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

interface Message {
  name: string;
  [key: string]: any;
}
