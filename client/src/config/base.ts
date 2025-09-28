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
