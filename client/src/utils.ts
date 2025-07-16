import { iconRoute } from "@client/routes";

type SignalEmitterCallback = (data?: any) => void | Promise<void>;

type SignalEmitterEvent = {
  callbackID: string;
  callback: SignalEmitterCallback;
};

export class SignalEmitter<EventNames extends string>
  implements ISignalEmitterPublicInterface<EventNames>
{
  private events: Record<EventNames, SignalEmitterEvent[]>;
  constructor() {
    this.events = {} as any;
  }

  on = (
    eventName: EventNames,
    callbackID: string,
    callback: SignalEmitterCallback
  ) => {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push({ callbackID, callback });
  };

  off = (eventName: EventNames, callbackID: string) => {
    if (this.events[eventName])
      this.events[eventName] = this.events[eventName].filter(
        (event) => event.callbackID !== callbackID
      );
  };

  emit(eventName: EventNames, data?: any) {
    if (this.events[eventName])
      this.events[eventName].forEach((event) => void event.callback(data));
  }
}

export interface ISignalEmitterPublicInterface<EventNames extends string> {
  on: (
    eventName: EventNames,
    callbackID: string,
    callback: SignalEmitterCallback
  ) => void;
  off: (eventName: EventNames, callbackID: string) => void;
}

export const makeIconLink = (
  iconBasename: string,
  url: string,
  blank?: boolean
) => {
  const d = document;
  const a = d.createElement("a");
  a.href = url;
  blank && (a.target = "_blank");
  const img = d.createElement("img");
  img.setAttribute("src", `${iconRoute}${iconBasename}`);
  img.setAttribute("width", "32px");
  a.appendChild(img);
  return a;
};

export const makeIconButton = (
  iconBasename: string,
  onClick: () => void,
  size?: [number, number]
) => {
  const d = document;
  const img = d.createElement("img");
  img.className = "smsh-button";
  img.setAttribute("src", `${iconRoute}${iconBasename}`);
  img.onclick = onClick;
  if (size) {
    img.style.width = size[0] + "px";
    img.style.height = size[1] + "px";
  }
  return img;
};

export const pickRandom = (array: any[]) =>
  array[Math.floor(Math.random() * array.length)];

export const minMax = (value: number, min: number, max: number) => {
  if (value < min) return min;
  else if (value > max) return max;
  return value;
};

export const getDivElPos = (el: HTMLElement): [number, number] => [
  Number(el.style.left?.replace("px", "")) ?? 0,
  Number(el.style.top?.replace("px", "")) ?? 0,
];
