type EventEmitterCallback = (data?: any) => void | Promise<void>;
type EventEmitterEvent = { callbackID: string; callback: EventEmitterCallback };
export class EventEmitter<EventNames extends string>
  implements IEventEmitterPublicInterface<EventNames>
{
  events: Record<EventNames, EventEmitterEvent[]>;
  constructor() {
    this.events = {} as any;
  }
  on(
    eventName: EventNames,
    callbackID: string,
    callback: EventEmitterCallback
  ) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push({ callbackID, callback });
  }
  off(eventName: EventNames, callbackID: string) {
    if (this.events[eventName])
      this.events[eventName] = this.events[eventName].filter(
        (event) => event.callbackID !== callbackID
      );
  }
  emit(eventName: EventNames, data: any) {
    if (this.events[eventName])
      this.events[eventName].forEach((event) => void event.callback(data));
  }
}
export interface IEventEmitterPublicInterface<EventNames extends string> {
  on: (
    eventName: EventNames,
    callbackID: string,
    callback: EventEmitterCallback
  ) => void;
  off: (eventName: EventNames, callbackID: string) => void;
}
