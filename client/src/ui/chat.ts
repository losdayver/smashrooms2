import { FocusManager, IFocusable } from "@client/focus/focusManager";

export class Chat implements IFocusable {
  private maxMessages: number;
  private maxMessageLength: number;
  private chatEl: HTMLDivElement;
  private messageContainer: HTMLDivElement;
  private input: HTMLInputElement;

  receiveMessage = (sender: string, message: string) => {
    const messageEl = document.createElement("div") as HTMLDivElement;
    messageEl.className = "chat__message";
    messageEl.innerText = `${sender}: ${
      message.length > this.maxMessageLength
        ? message.substring(this.maxMessageLength) + "..."
        : message
    }`;
    this.messageContainer.appendChild(messageEl);

    if (this.messageContainer.children.length > this.maxMessages)
      this.messageContainer.children[0].remove();
  };

  private onSendPressed: (message: string) => void;

  private send = () => {
    if (!this.input.value) return;
    this.onSendPressed(this.input.value);
    this.input.value = "";
    this.focusManager.setFocus("client");
  };

  private focusManager: FocusManager;
  getFocusTag = () => "chat";
  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (key) => {
    if (key == "back") this.focusManager.setFocus("client");
    if (key == "confirm") this.send();
  };
  onUnfocused = () => {
    this.input.blur();
  };
  onFocused = () => {
    this.input.focus();
    setTimeout(() => (this.input.value = ""), 0); // todo fix bug with t appearing in input when switching to a chat via key T press
  };
  onFocusRegistered: IFocusable["onFocusRegistered"] = (focusManager) => {
    this.focusManager = focusManager;
  };

  constructor(
    containerEl: HTMLDivElement,
    onSendPressed: (message: string) => void,
    maxMessages: number = 10,
    maxMessageLength: number = 30
  ) {
    this.maxMessages = maxMessages;
    this.onSendPressed = onSendPressed;

    const input = document.createElement("input") as HTMLInputElement;
    input.classList.add("chat__input", "smsh-input");
    input.type = "text";
    input.maxLength = maxMessageLength;
    input.onclick = () => {
      this.focusManager.setFocus(this.getFocusTag());
    };
    input.onblur = () => {
      this.focusManager.setFocus("client");
    };
    this.input = input;

    this.maxMessageLength = maxMessageLength;

    const submit = document.createElement("button") as HTMLInputElement;
    submit.innerHTML = "Send";
    submit.classList.add("chat__submit", "smsh-button");

    submit.addEventListener("click", this.send);

    const controls = document.createElement("div") as HTMLDivElement;

    controls.className = "chat__controls-container";
    controls.append(input, submit);

    const messageContainer = document.createElement("div") as HTMLDivElement;
    messageContainer.className = "chat__message-container";
    this.messageContainer = messageContainer;

    const chatEl = document.createElement("div") as HTMLDivElement;
    chatEl.className = "chat";

    chatEl.append(messageContainer, controls);

    this.chatEl = chatEl;

    containerEl.appendChild(chatEl);
  }
}
