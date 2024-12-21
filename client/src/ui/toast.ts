import { NotificationTypesExt } from "../../../types/messages";
import { iconRoute } from "../routes.js";

const toastIconMap: Partial<Record<NotificationTypesExt, string>> = {
  info: "info.png",
  warning: "warning.png",
  connected: "connected.png",
  disconnected: "disconnected.png",
};

export class Toast {
  private toastEl: HTMLDivElement;
  private maxCount = 5;
  private timeout: number;
  private removeTimeout: number;

  constructor(
    parentEl: HTMLDivElement | HTMLSpanElement,
    timeoutMilliseconds = 5000
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

  notify = (message: string, type: NotificationTypesExt) => {
    if (this.toastEl.children.length >= this.maxCount)
      this.toastEl.children[0].remove();
    else if (this.toastEl.children.length == 0) this.restartRemoveTimeout();

    const notification = document.createElement("div");
    notification.className = "toast__notification";

    const notificationText = document.createElement("div");
    notificationText.className = "toast__notification__text";
    notificationText.innerText = message;

    const notificationIcon = document.createElement("img");
    notificationIcon.className = "toast__notification__icon";
    notificationIcon.src = `${iconRoute}${
      toastIconMap[type] || toastIconMap.info
    }`;

    notification.append(notificationIcon, notificationText);

    this.toastEl.appendChild(notification);
  };
}
