import {
  ClientActionCodesExt,
  ClientActionStatusExt,
  IClientChatMessageExt,
  IClientActionMessageExt,
  IConnectMessageExt,
  IMessageExt,
  IClientSceneMetaMessageExt,
  IConnectResponseMessageExt,
} from "../../../types/messages";
import { PropIDExt } from "../../../types/sceneTypes";
import { ControlsConfig, IControlMap } from "../config/config.js";
import { FocusManager, IFocusable } from "../focus/focusManager.js";
import { EventEmitter, IEventEmitterPublicInterface } from "../utils.js";

type ClientEventEmitterType =
  | IMessageExt["name"]
  | "socketOpen"
  | "socketClose";

export class Client
  implements IEventEmitterPublicInterface<ClientEventEmitterType>, IFocusable
{
  private controlsConfig: ControlsConfig;
  private socket: WebSocket;
  private ID: PropIDExt;
  private connString: string;

  readonly isRegistered = false;

  private eventEmitter = new EventEmitter<ClientEventEmitterType>();
  on = (
    eventName: ClientEventEmitterType,
    callbackID: string,
    callback: (data?: any) => void | Promise<void>
  ) => this.eventEmitter.on(eventName, callbackID, callback);
  off = (eventName: ClientEventEmitterType, callbackID: string) =>
    this.eventEmitter.off(eventName, callbackID);

  private focusManager: FocusManager;
  getFocusTag = () => "client";
  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (e, status) => {
    if (e.repeat) return;
    if (status == "down") {
      this.controlsHandler(e.code, true);
      if (e.code == "KeyT") this.focusManager.setFocus("chat");
      else if (e.code == "Escape") this.focusManager.setFocus("menu");
    } else {
      this.controlsHandler(e.code, false);
    }
  };
  private controlsHandler = (eCode: string, isPressed: boolean) => {
    const map: Partial<Record<keyof IControlMap, ClientActionCodesExt>> = {
      up: "jump",
      right: "right",
      down: "duck",
      left: "left",
      fire: "fire",
      revive: "revive",
    };
    for (const [k, v] of Object.entries(map)) {
      if (
        this.controlsConfig.getValue(k as keyof IControlMap).includes(eCode)
      ) {
        this.sendInput(
          v as ClientActionCodesExt,
          isPressed ? "pressed" : "released"
        );
        return;
      }
    }
  };
  onFocusRegistered: IFocusable["onFocusRegistered"] = (focusManager) => {
    this.focusManager = focusManager;
  };

  private initSocket = () => {
    this.socket = new WebSocket(this.connString);
    this.socket.onopen = () => this.eventEmitter.emit("socketOpen");
    this.socket.onclose = () => this.eventEmitter.emit("socketClose");
    this.socket.onmessage = this.onmessage;
  };

  private socketSend = <T extends object>(data: T) =>
    this.socket.send(JSON.stringify(data));

  connectByClientName = (clientName: string) => {
    if (
      [WebSocket.CLOSED, WebSocket.CLOSING].includes(
        this.socket.readyState as any
      )
    )
      this.initSocket();
    this.socketSend({
      name: "conn",
      clientName: clientName,
    } satisfies IConnectMessageExt);
  };
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

  private onmessage = async (message: MessageEvent<string>) => {
    let parsedMsg: IMessageExt;
    try {
      parsedMsg = JSON.parse(message.data);
    } catch {
      return;
    }
    this.eventEmitter.emit(parsedMsg.name, parsedMsg);
  };

  constructor(connString: string) {
    this.controlsConfig = new ControlsConfig("controls");
    this.connString = connString;
    this.initSocket();
    this.on("connRes", "self", (data: IConnectResponseMessageExt) => {
      (this.isRegistered as any) = data.status == "allowed";
    });
    this.on("socketClose", "self", () => {
      this.initSocket();
      (this.isRegistered as any) = false;
    });
  }
}
