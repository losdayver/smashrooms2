import {
  ClientActionCodesExt,
  ClientActionStatusExt,
  IClientChatMessageExt,
  IClientActionMessageExt,
  IConnectMessageExt,
  IMessageExt,
  IClientSceneMetaMessageExt,
} from "../../../types/messages";
import { PropIDExt } from "../../../types/sceneTypes";
import { EventEmitter, IEventEmitterPublicInterface } from "../utils.js";

export class Client
  implements IEventEmitterPublicInterface<IMessageExt["name"]>
{
  private socket: WebSocket;
  private ID: PropIDExt;
  private connString: string;

  private eventEmitter = new EventEmitter<IMessageExt["name"]>();
  on = (
    eventName: IMessageExt["name"],
    callbackID: string,
    callback: (data?: any) => void | Promise<void>
  ) => this.eventEmitter.on(eventName, callbackID, callback);
  off = (eventName: IMessageExt["name"], callbackID: string) =>
    this.eventEmitter.off(eventName, callbackID);

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

  onmessage = async (message: MessageEvent<string>) => {
    let parsedMsg: IMessageExt;
    try {
      parsedMsg = JSON.parse(message.data);
    } catch {
      return;
    }
    console.log(parsedMsg);
    this.eventEmitter.emit(parsedMsg.name, parsedMsg);
  };

  constructor(connString: string) {
    this.connString = connString;
    this.socket = new WebSocket(this.connString);
    this.socket.onmessage = this.onmessage;
  }
}
