import {
  ClientActionCodesExt,
  ClientActionStatusExt,
  IClientChatMessageExt,
  IClientActionMessageExt,
  IConnectMessageExt,
  IMessageExt,
  IClientSceneMetaMessageExt,
  IConnectResponseMessageExt,
  ISceneUpdatesMessageExt,
  IServerChatMessageExt,
  IServerSceneMetaMessageExt,
  IServerNotificationExt,
  NotificationTypesExt,
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
  onSceneMetaEventHandlers: Record<
    string,
    (stageSystemName: string) => void | Promise<void>
  > = {};
  onServerNotifyHandlers: Record<
    string,
    (message: string, type: NotificationTypesExt) => void | Promise<void>
  > = {};

  private socketSend = <T extends object>(data: T) =>
    this.socket.send(JSON.stringify(data));

  connectByClientName = (clientName: string) =>
    this.socketSend({
      name: "conn",
      clientName: clientName,
    } satisfies IConnectMessageExt);
  sendInput = (code: ClientActionCodesExt, status: ClientActionStatusExt) =>
    this.socketSend({
      name: "clientAct",
      clientID: this.ID,
      data: {
        code,
        status,
      },
    } satisfies IClientActionMessageExt);
  getSceneMeta = () =>
    this.socketSend({
      name: "clientSceneMeta",
    } satisfies IClientSceneMetaMessageExt);
  sendChatMessage = (message: string) =>
    this.socketSend({
      name: "clientChat",
      message,
    } satisfies IClientChatMessageExt);

  private incomingMessageHandlers: Partial<
    Record<IMessageExt["name"], (msgObj: any) => void | Promise<void>>
  > = {
    connRes: (msgObj: IConnectResponseMessageExt) => {
      if (msgObj.status == "allowed") {
        this.ID = msgObj.clientID;
        void Promise.all(
          Object.values(this.onConnectHandlers).map(
            async (callback) => await callback(true)
          )
        );
      } else
        void Promise.all(
          Object.values(this.onConnectHandlers).map(
            async (callback) => await callback(false)
          )
        );
    },
    scene: (msgObj: ISceneUpdatesMessageExt) => {
      void Promise.all(
        Object.values(this.onSceneEventHandlers).map(
          async (callback) => await callback(msgObj.data)
        )
      );
    },
    serverChat: (msgObj: IServerChatMessageExt) => {
      void Promise.all(
        Object.values(this.onChatEventHandlers).map(
          async (callback) => await callback(msgObj.sender, msgObj.message)
        )
      );
    },
    serverSceneMeta: (msgObj: IServerSceneMetaMessageExt) => {
      void Promise.all(
        Object.values(this.onSceneMetaEventHandlers).map(
          async (callback) => await callback(msgObj.stageSystemName)
        )
      );
    },
    serverNotify: (msgObj: IServerNotificationExt) => {
      void Promise.all(
        Object.values(this.onServerNotifyHandlers).map(
          async (callback) => await callback(msgObj.message, msgObj.type)
        )
      );
    },
  };

  onmessage = async (message: MessageEvent<string>) => {
    let parsedMsg: IMessageExt;
    try {
      parsedMsg = JSON.parse(message.data);
    } catch {
      return;
    }
    console.log(parsedMsg);
    this.incomingMessageHandlers[parsedMsg.name]?.(parsedMsg);
  };

  constructor(connString: string) {
    this.connString = connString;
    this.socket = new WebSocket(this.connString);
    this.socket.onmessage = this.onmessage;
  }
}
