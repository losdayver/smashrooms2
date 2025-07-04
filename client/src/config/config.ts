export abstract class LSConfig<C extends object> {
  private lsKey: string;
  private disableCache = false;
  private obj: C;

  protected abstract getDefaultObj: () => C;

  private getObj = () => {
    if (this.obj) return this.obj;
    let obj: C;
    const str = localStorage.getItem(this.lsKey);
    if (!str) {
      obj = { ...this.getDefaultObj() };
      this.saveObj(obj);
    } else {
      obj = JSON.parse(str);
      this.obj = obj;
    }
    return obj;
  };

  private saveObj = (obj: C) => {
    if (!this.disableCache) this.obj = obj;
    localStorage.setItem(this.lsKey, JSON.stringify(obj));
  };

  getValue = (key: keyof C) => this.getObj()[key];

  setValue = (key: keyof C, value: C[keyof C]) => {
    const obj = this.getObj();
    obj[key] = value;
    this.saveObj(obj);
  };

  setMultiple = (partObj: Partial<C>) => {
    const obj = this.getObj();
    const newObj = { ...obj, ...partObj };
    this.saveObj(newObj);
  };

  init = () => {
    this.getObj();
  };

  reset = () => this.saveObj(this.getDefaultObj());

  constructor(lsKey: string, disableCache?: boolean) {
    this.lsKey = lsKey;
    this.disableCache = disableCache;
  }
}

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
] as const;

export type ControlsObjType = Record<(typeof controlsList)[number], string[]>;

export class AudioConfig extends LSConfig<AudioSettingObjType> {
  static instance: AudioConfig;
  protected getDefaultObj = () => defaultAudioSettingsObj;

  constructor() {
    super("audioVolume");
    if (!AudioConfig.instance) AudioConfig.instance = this;
    return AudioConfig.instance;
  }
}

const defaultAudioSetting: AudioSetting = {
  muted: false,
  currentVolume: 0.3,
};

const defaultAudioSettingsObj: AudioSettingObjType = {
  music: defaultAudioSetting,
  sfx: defaultAudioSetting,
};

export type AudioSettingObjType = Record<
  (typeof audioSettingsKeyList)[number],
  AudioSetting
>;

const audioSettingsKeyList = ["music", "sfx"] as const;

export type AudioSetting = {
  muted: boolean;
  currentVolume: number;
};
