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

export const pickRandom = (array: any[]) =>
  array[Math.floor(Math.random() * array.length)];
