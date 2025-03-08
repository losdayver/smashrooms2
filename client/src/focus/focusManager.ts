import {
  ControlsConfig,
  controlsList,
  ControlsObjType,
} from "../config/config.js";
import {
  gamepadEventToKeyMap,
  GamepadControlsObjType,
} from "./gamepadLayouts.js";

export class FocusManager {
  private registeredReceivers: Map<string, IFocusable> = new Map();
  private currentFocusedTag: string;
  private controlsConfig = new ControlsConfig();
  private gamepadsMap: Map<number, Gamepad> = new Map();
  private activeGamepadKeys = new Set<string>();

  private getCurrentTag = (): IFocusable =>
    this.registeredReceivers.get(this.currentFocusedTag);

  register = (receiver: IFocusable): void => {
    this.registeredReceivers.set(receiver.getFocusTag(), receiver);
    receiver.onFocusRegistered?.(this);
  };

  unregister = (receiver: IFocusable): void => {
    this.registeredReceivers.delete(receiver.getFocusTag());
    receiver.onFocusUnregistered?.();
  };

  setFocus = (tag: string): void => {
    const newReceiver = this.registeredReceivers.get(tag);
    if (!newReceiver) return;
    this.getCurrentTag()?.onUnfocused?.();
    newReceiver.onFocused?.();
    this.currentFocusedTag = tag;
  };

  private handleGamepadConnection = (e: GamepadEvent) => {
    this.gamepadsMap.set(e.gamepad.index, e.gamepad);
  };

  private updateStatus = () => {
    if (navigator.userAgent.toLowerCase().includes("chrome")) {
      this.gamepadsMap.clear();
      navigator.getGamepads().forEach((gamepad) => {
        this.gamepadsMap.set(gamepad?.index, gamepad);
      });
    }
  };

  // TODO: determine gamepad layout based on its properties

  private handleGamepadDisconnection = (e: GamepadEvent) => {
    this.gamepadsMap.delete(e.gamepad.index);
  };

  private keyListener = async (event: KeyboardEvent, isDown: boolean) => {
    if (event.key == "Tab") event.preventDefault();
    if (event.repeat) return;
    try {
      for (const key of controlsList) {
        if (this.controlsConfig.getValue(key).includes(event.code)) {
          await this.getCurrentTag()?.onFocusReceiveKey?.(
            key,
            isDown ? "down" : "up",
            event.code
          );
          return;
        }
      }
      await this.getCurrentTag()?.onFocusReceiveKey?.(
        null,
        isDown ? "down" : "up",
        event.code
      );
    } catch {
      this.controlsConfig.reset();
    }
  };

  private getKeyControl = async (
    key: string
  ): Promise<keyof ControlsObjType> => {
    for (const control of controlsList)
      if (this.controlsConfig.getValue(control).includes(key)) return control;
    return null;
  };

  private gamepadKeyListener = async () => {
    this.updateStatus();
    for (const gamepad of navigator.getGamepads()) {
      if (!gamepad) return requestAnimationFrame(this.gamepadKeyListener);
      for (const [gpKey, isActivated] of Object.entries(gamepadEventToKeyMap)) {
        const keyControl = await this.getKeyControl(gpKey);
        const previouslyActivated = this.activeGamepadKeys.has(gpKey);
        if (isActivated(gamepad)) {
          if (!previouslyActivated) {
            this.activeGamepadKeys.add(gpKey);
            await this.getCurrentTag()?.onFocusReceiveKey?.(
              keyControl,
              "down",
              gpKey
            );
          }
        } else {
          if (previouslyActivated) {
            await this.getCurrentTag()?.onFocusReceiveKey?.(
              keyControl,
              "up",
              gpKey
            );
            this.activeGamepadKeys.delete(gpKey);
          }
        }
      }
    }
    requestAnimationFrame(this.gamepadKeyListener);
  };

  // TODO: split gamepad logic into different class
  constructor() {
    document.addEventListener("keydown", (e) => this.keyListener(e, true));
    document.addEventListener("keyup", (e) => this.keyListener(e, false));
    window.addEventListener("gamepadconnected", (e) => {
      // alert("Gamepad is connected!");
      this.handleGamepadConnection(e);
    });
    window.addEventListener("gamepaddisconnected", (e) => {
      // alert("Gamepad is disconnected!");
      this.handleGamepadDisconnection(e);
    });
    requestAnimationFrame(this.gamepadKeyListener);
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
