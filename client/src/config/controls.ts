import { LSConfig } from "@client/config/base";

export class ControlsConfig extends LSConfig<ControlsObjType> {
  static instance: ControlsConfig;
  protected getDefaultObj = () => defaultControlsObj;

  constructor() {
    super("controls");
    if (!ControlsConfig.instance) ControlsConfig.instance = this;
    return ControlsConfig.instance;
  }
}

// TODO: expand this list with gamepad buttons only on "gamepadconnected" events
export const defaultControlsObj: ControlsObjType = {
  up: ["ArrowUp", "Space", "Cross"],
  right: ["ArrowRight", "KeyD", "LStickRight", "DPadRight"],
  down: ["ArrowDown", "KeyS", "LStickDown", "DPadDown"],
  left: ["ArrowLeft", "KeyA", "LStickLeft", "DPadLeft"],
  fire: ["ShiftLeft", "Square"],
  chat: ["KeyT", "Share"],
  back: ["Escape", "Options"],
  confirm: ["Enter"],
  revive: ["KeyR", "Circle"],
  swap: ["KeyQ", "Triangle"],
  select: ["Tab"],
  // editor
  altAction: ["ShiftLeft", "ShiftRight"],
  delete: ["Delete"],
};

export const controlsList = [
  "up",
  "right",
  "down",
  "left",
  "fire",
  "chat",
  "back",
  "confirm",
  "revive",
  "swap",
  "select",
  // editor
  "altAction",
  "delete",
] as const;

export type ControlsObjType = Record<(typeof controlsList)[number], string[]>;
