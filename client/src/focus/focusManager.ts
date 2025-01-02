export class FocusManager {
  private registeredReceivers: Map<string, IFocusable> = new Map();
  private currentFocusedTag: string;
  private getCurrent = () =>
    this.registeredReceivers.get(this.currentFocusedTag);
  register = (receiver: IFocusable) => {
    this.registeredReceivers.set(receiver.getFocusTag(), receiver);
    receiver.onFocusRegistered?.(this);
  };
  unregister = (receiver: IFocusable) => {
    this.registeredReceivers.delete(receiver.getFocusTag());
    receiver.onFocusUnregistered?.();
  };
  setFocus = (tag: string) => {
    const newReceiver = this.registeredReceivers.get(tag);
    if (!newReceiver) return;
    this.getCurrent()?.onUnfocused?.();
    newReceiver.onFocused?.();
    this.currentFocusedTag = tag;
  };
  constructor() {
    document.addEventListener(
      "keydown",
      async (e) => await this.getCurrent()?.onFocusReceiveKey?.(e, "down")
    );
    document.addEventListener(
      "keyup",
      async (e) => await this.getCurrent()?.onFocusReceiveKey?.(e, "up")
    );
  }
}

export interface IFocusable {
  getFocusTag: () => string;
  onFocusReceiveKey?: (
    e: KeyboardEvent,
    status: "down" | "up"
  ) => void | Promise<void>;
  onFocused?: () => void | Promise<void>;
  onUnfocused?: () => void | Promise<void>;
  onFocusRegistered?: (focusManager: FocusManager) => void | Promise<void>;
  onFocusUnregistered?: () => void | Promise<void>;
}
