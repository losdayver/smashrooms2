import {
  ControlsConfig,
  controlsList,
  ControlsObjType,
} from "@client/config/config";
import { gamepadEventToKeyMap } from "@client/focus/gamepadLayouts";

export interface IFocusable {
  getFocusTag: () => IFocusableTag;
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

export type IFocusableTag = string | symbol;

export class FocusManager {
  constructor() {
    document.addEventListener("keydown", (event: KeyboardEvent) =>
      this.keyListener(event, true)
    );
    document.addEventListener("keyup", (event: KeyboardEvent) =>
      this.keyListener(event, false)
    );
    setInterval(
      () => this.gamepadKeyListener(),
      FocusManager.gamepadStateReadInterval
    );
  }

  private registeredReceivers: Map<IFocusableTag, IFocusable> = new Map();
  private currentFocusedTag: IFocusableTag;
  private controlsConfig: ControlsConfig = new ControlsConfig();
  private static gamepadStateReadInterval: number = 10;
  private activeGamepadKeys: Set<string> = new Set<string>();

  private keyListener = async (event: KeyboardEvent, isDown: boolean) => {
    if (event.key == "Tab") event.preventDefault();
    if (event.repeat) return;
    try {
      for (const key of controlsList) {
        if (this.controlsConfig.getValue(key).includes(event.code)) {
          await this.getCurrent()?.onFocusReceiveKey?.(
            key,
            isDown ? "down" : "up",
            event.code
          );
        }
      }
      await this.getCurrent()?.onFocusReceiveKey?.(
        null,
        isDown ? "down" : "up",
        event.code
      );
    } catch {
      this.controlsConfig.reset();
    }
  };
  private gamepadKeyListener = async (): Promise<void> => {
    for (const gamepad of navigator.getGamepads()) {
      await this.handleGamepad(gamepad);
    }
  };
  private handleGamepad = async (gamepad: Gamepad): Promise<void> => {
    if (gamepad === null) return;
    for (const [gpKey, isActivated] of Object.entries(gamepadEventToKeyMap)) {
      const keyControl = this.getKeyControl(gpKey);
      const isPreviouslyActivated = this.activeGamepadKeys.has(gpKey);
      if (isActivated(gamepad)) {
        if (!isPreviouslyActivated) {
          await this.getCurrent()?.onFocusReceiveKey?.(
            keyControl,
            "down",
            gpKey
          );
          this.activeGamepadKeys.add(gpKey);
        }
      } else {
        if (isPreviouslyActivated) {
          await this.getCurrent()?.onFocusReceiveKey?.(keyControl, "up", gpKey);
          this.activeGamepadKeys.delete(gpKey);
        }
      }
    }
  };
  private getKeyControl = (key: string): keyof ControlsObjType => {
    for (const control of controlsList)
      if (this.controlsConfig.getValue(control).includes(key)) return control;
    return null;
  };

  getCurrent = (): IFocusable =>
    this.registeredReceivers.get(this.currentFocusedTag);
  getCurrentTag = (): IFocusableTag =>
    this.registeredReceivers.get(this.currentFocusedTag)?.getFocusTag();
  register = (receiver: IFocusable): void => {
    this.registeredReceivers.set(receiver.getFocusTag(), receiver);
    receiver.onFocusRegistered?.(this);
  };
  unregister = (receiver: IFocusable): void => {
    this.registeredReceivers.delete(receiver.getFocusTag());
    receiver.onFocusUnregistered?.();
  };
  setFocus = (tag: IFocusableTag): void => {
    const newReceiver = this.registeredReceivers.get(tag);
    if (!newReceiver) return;
    this.getCurrent()?.onUnfocused?.();
    newReceiver.onFocused?.();
    this.currentFocusedTag = tag;
  };
}
