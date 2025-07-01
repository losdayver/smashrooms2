import {
  ControlsConfig,
  controlsList,
  ControlsObjType,
} from "@client/config/config";
import {
  gamepadEventToKeyMap,
  GamepadControlsObjType,
} from "@client/focus/gamepadLayouts";

export class FocusManager {
  private registeredReceivers: Map<string, IFocusable> = new Map();
  private currentFocusedTag: string;
  private controlsConfig: ControlsConfig = new ControlsConfig();
  private static gamepadStateReadInterval: number = 10;
  private activeGamepadKeys: Set<string> = new Set<string>();

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

  // TODO: determine gamepad layout based on its properties

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
          await this.getCurrentTag()?.onFocusReceiveKey?.(
            keyControl,
            "down",
            gpKey
          );
          this.activeGamepadKeys.add(gpKey);
        }
      } else {
        if (isPreviouslyActivated) {
          await this.getCurrentTag()?.onFocusReceiveKey?.(
            keyControl,
            "up",
            gpKey
          );
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

  // TODO: gamepad haptics

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
