export abstract class LSConfig<C extends object = object> {
  private lskey: string;
  private disableCache = false;
  private obj: C;
  protected abstract getDefaultObj: () => C;
  private getObj = () => {
    if (this.obj) return this.obj;
    let obj: C;
    const str = localStorage.getItem(this.lskey);
    if (!str) {
      obj = this.getDefaultObj();
      this.saveObj(obj);
    } else {
      obj = JSON.parse(str);
      this.obj = obj;
    }
    return obj;
  };
  private saveObj = (obj: C) => {
    if (!this.disableCache) this.obj = obj;
    localStorage.setItem(this.lskey, JSON.stringify(obj));
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
    this.lskey = lsKey;
    this.disableCache = disableCache;
  }
}

export class ControlsConfig extends LSConfig<IControlMap> {
  protected getDefaultObj = () =>
    ({
      up: ["ArrowUp"],
      right: ["ArrowRight"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      fire: ["Space"],
      chat: ["KeyT"],
      back: ["Escape"],
      confirm: ["Enter"],
      revive: ["KeyR"],
    } satisfies IControlMap);
}

export interface IControlMap {
  up: string[];
  right: string[];
  down: string[];
  left: string[];
  fire: string[];
  chat: string[];
  back: string[];
  confirm: string[];
  revive: string[];
}
