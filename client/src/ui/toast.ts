import { iconRoute } from "../routes.js";

export type ToastIconTypes = "info" | "warning";

export class Toast {
  private toastEl: HTMLDivElement;
  private maxCount = 5;
  private timeout: number;
  private removeTimeout: number;

  constructor(
    parentEl: HTMLDivElement | HTMLSpanElement,
    timeoutMilliseconds = 2000
  ) {
    this.timeout = timeoutMilliseconds;

    this.toastEl = document.createElement("div");
    this.toastEl.className = "toast";

    parentEl.appendChild(this.toastEl);
  }

  restartRemoveTimeout = () => {
    if (this.removeTimeout) clearTimeout(this.removeTimeout);
    this.removeTimeout = setTimeout(() => {
      this.toastEl.children[0].remove();
      if (this.toastEl.children.length) this.restartRemoveTimeout();
    }, this.timeout);
  };

  notify = (message: string, type: ToastIconTypes) => {
    if (this.toastEl.children.length >= this.maxCount)
      this.toastEl.children[0].remove();
    else if (this.toastEl.children.length == 0) this.restartRemoveTimeout();

    const notification = document.createElement("div");
    notification.className = "toast__notification";

    const notificationText = document.createElement("div");
    notificationText.className = "toast__notification__text";
    notificationText.innerHTML = message;

    const notificationIcon = document.createElement("img");
    notificationText.className = "toast__notification__icon";
    notificationIcon.src = `${iconRoute}${type}`;

    notification.append(notificationIcon, notificationText);

    this.toastEl.appendChild(notification);
  };
}
