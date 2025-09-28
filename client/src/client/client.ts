import {
  ClientActionStatusExt,
  IClientChatMessageExt,
  IClientActionMessageExt,
  IConnectMessageExt,
  IClientSceneMetaMessageExt,
  IConnectResponseMessageExt,
  IStageChangeExt,
  IWebDBQuery,
  IWebDBRes,
} from "@stdTypes/messages";
import { PropIDExt } from "@stdTypes/sceneTypes";
import { ControlsObjType } from "@client/config/controls";
import { FocusManager, IFocusable } from "@client/focus/focusManager";
import { SignalEmitter, ISignalEmitterPublicInterface } from "@client/utils";
import { ClientActionCodesExt } from "@stdTypes/messages";
import { SmshMessageTypeExt } from "@smshTypes/messages";
import { iconRoute } from "@client/routes";

type ClientEventEmitterType =
  | SmshMessageTypeExt["name"]
  | "socketOpen"
  | "socketClose"
  | ClientErrorEventEmitterType;

type ClientErrorEventEmitterType = "socketError" | "socketConnectionError";

export class Client
  implements ISignalEmitterPublicInterface<ClientEventEmitterType>, IFocusable
{
  private socket: WebSocket;
  private ID: PropIDExt;
  private connURL: string;
  private errorEmitted: boolean = false;
  readonly isRegistered: boolean = false;

  private signalEmitter = new SignalEmitter<ClientEventEmitterType>();
  on = (
    eventName: ClientEventEmitterType,
    callbackID: string,
    callback: (data?: any) => void | Promise<void>
  ) => this.signalEmitter.on(eventName, callbackID, callback);
  off = (eventName: ClientEventEmitterType, callbackID: string) =>
    this.signalEmitter.off(eventName, callbackID);

  private focusManager: FocusManager;

  getFocusTag = () => "client";

  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (key, status) => {
    if (status == "down") {
      this.controlsHandler(key, true);
      if (key == "chat") this.focusManager.setFocus("chat");
      else if (key == "back") this.focusManager.setFocus("menu");
      else if (key == "select") this.focusManager.setFocus("scoreboard");
    } else {
      this.controlsHandler(key, false);
    }
  };

  private controlsHandler = (
    key: keyof ControlsObjType,
    isPressed: boolean
  ) => {
    const map: Partial<Record<keyof ControlsObjType, ClientActionCodesExt>> = {
      up: "jump",
      right: "right",
      down: "duck",
      left: "left",
      fire: "fire",
      revive: "revive",
      swap: "swap",
    };
    const control = map[key];
    if (!control) return;
    this.sendInput(control, isPressed ? "pressed" : "released");
  };
  onFocusRegistered: IFocusable["onFocusRegistered"] = (focusManager) => {
    this.focusManager = focusManager;
  };

  private initSocket = () => {
    this.socket = new WebSocket(this.connURL);
    this.socket.onopen = () => this.signalEmitter.emit("socketOpen");
    this.socket.onclose = (event: CloseEvent) => {
      if (!event.wasClean) {
        if (!this.errorEmitted) this.emitError("socketError");
      }
      this.signalEmitter.emit("socketClose");
    };
    this.socket.onerror = () => {
      if (!this.errorEmitted) this.emitError("socketConnectionError");
    };
    this.socket.onmessage = this.onmessage;
  };

  private emitError = (error: ClientErrorEventEmitterType) => {
    this.signalEmitter.emit(error);
    this.errorEmitted = true;
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

  private makeDBQuery = (
    queryName: string,
    params?: any,
    sequence?: string
  ) => {
    this.socketSend({
      name: "webDBQuery",
      queryName,
      params,
      sequence,
    } satisfies IWebDBQuery);
  };

  private querySequence = 0;
  queryDBPromisified = async (
    queryName: string,
    params?: any
  ): Promise<IWebDBRes["rows"]> => {
    const sequence = ++this.querySequence;
    this.makeDBQuery(queryName, params, sequence.toString());
    return await new Promise<IWebDBRes["rows"]>((resolve) => {
      this.on("webDBRes", `query${sequence}`, (data: IWebDBRes) => {
        if (data.sequence == sequence.toString()) resolve(data.rows);
      });
    });
  };

  private onmessage = async (message: MessageEvent<string>) => {
    let parsedMsg: SmshMessageTypeExt;
    try {
      parsedMsg = JSON.parse(message.data);
    } catch {
      return;
    }
    this.signalEmitter.emit(parsedMsg.name, parsedMsg);
  };

  constructor(connURL: string) {
    this.connURL = connURL;
    this.initSocket();
    this.on("socketError", "easel", () => {
      const errorImg = document.createElement("img");
      errorImg.src = `${iconRoute}networkError.png`;
      errorImg.alt = "Network error occured!";
      errorImg.classList.add("network-error");
      document.body.appendChild(errorImg);
    });
    this.on("connRes", "self", (data: IConnectResponseMessageExt) => {
      (this.isRegistered as any) = data.status == "allowed";
    });
    // this.on("socketClose", "self", () => {
    //   this.initSocket();
    //   (this.isRegistered as any) = false;
    // });
    this.on("stageChange", "self", (msg: IStageChangeExt) => {
      if (msg.status == "reloadStage")
        this.sendInput("reviveSilent", "pressed");
    });
  }
}
