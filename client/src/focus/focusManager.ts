import {
  ControlsConfig,
  controlsList,
  ControlsObjType,
} from "../config/config.js";

export class FocusManager {
  private registeredReceivers: Map<string, IFocusable> = new Map();
  private currentFocusedTag: string;
  private controlsConfig = new ControlsConfig();
  private getCurrent = () =>
    this.registeredReceivers.get(this.currentFocusedTag);
  register = (receiver: IFocusable) => {
    this.registeredReceivers.set(receiver.getFocusTag(), receiver);
    receiver.onFocusRegistered?.(this);
  };
  unregister = (receiver: IFocusable) => {
    this.registeredReceivers.delete(receiver.getFocusTag());
    receiver.onFocusUnregistered?.();
  };
  setFocus = (tag: string) => {
    const newReceiver = this.registeredReceivers.get(tag);
    if (!newReceiver) return;
    this.getCurrent()?.onUnfocused?.();
    newReceiver.onFocused?.();
    this.currentFocusedTag = tag;
  };
  private keyListener = async (e: KeyboardEvent, isDown: boolean) => {
    if (e.repeat) return;
    for (const key of controlsList) {
      if (this.controlsConfig.getValue(key).includes(e.code)) {
        await this.getCurrent()?.onFocusReceiveKey?.(
          key,
          isDown ? "down" : "up",
          e.code
        );
        return;
      }
    }
    await this.getCurrent()?.onFocusReceiveKey?.(
      null,
      isDown ? "down" : "up",
      e.code
    );
  };
  constructor() {
    document.addEventListener("keydown", (e) => this.keyListener(e, true));
    document.addEventListener("keyup", (e) => this.keyListener(e, false));
  }
}

export interface IFocusable {
  getFocusTag: () => string;
  onFocusReceiveKey?: (
    key: keyof ControlsObjType,
    status: "down" | "up",
    realKeyCode: string
  ) => void | Promise<void>;
  onFocused?: () => void | Promise<void>;
  onUnfocused?: () => void | Promise<void>;
  onFocusRegistered?: (focusManager: FocusManager) => void | Promise<void>;
  onFocusUnregistered?: () => void | Promise<void>;
}
