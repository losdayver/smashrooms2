import {
  IConnectResponseMessageExt,
  IServerChatMessageExt,
  IServerNotificationExt,
} from "../../types/messages";
import { AudioManager } from "./audio/audioManager.js";
import { Client } from "./client/client.js";
import { EaselManager } from "./easel/easelManager.js";
import { FocusManager, IFocusable } from "./focus/focusManager.js";
import { Modal } from "./modal/modal.js";
import { iconRoute, repoRoute } from "./routes.js";
import { Chat } from "./ui/chat.js";
import { Toast } from "./ui/toast.js";

export class RegModal extends Modal {
  private onSubmit: (clientName: string) => void;
  constructor(
    container: HTMLDivElement,
    onSubmit: (clientName: string) => void
  ) {
    super(container, {
      title: "Enter game",
      width: 500,
      noCloseButton: true,
    });
    this.onSubmit = onSubmit;
  }

  protected getContent = () => {
    const label = document.createElement("label");

    const input = document.createElement("input");
    input.classList.add("smsh-input");
    input.type = "text";

    label.append("Enter player name:", input);

    const submit = document.createElement("input");
    submit.classList.add("smsh-button");
    submit.type = "submit";
    submit.value = "Connect";

    const form = document.createElement("form");

    form.append(label, submit);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onSubmit(input.value);
    });
    form.classList.add("shmsh-form");

    return form;
  };
}

// todo create unified menu modal factory
export class GameMenuModal extends Modal implements IFocusable {
  constructor(container: HTMLDivElement) {
    super(container, {
      title: "Menu",
      width: 500,
    });
  }
  private focusManager: FocusManager;

  onClose = () => {
    this.focusManager.setFocus("client");
  };

  getFocusTag = () => "menu";
  onFocused = this.show;

  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (e, status) => {
    if (e.repeat) return;
    if (status == "down") {
      if (e.code == "Escape") this.hide();
    }
  };

  controlsModal;

  onFocusRegistered = (focusManager: FocusManager) => {
    this.focusManager = focusManager;

    this.controlsModal = new ControlsModal(
      document.querySelector<HTMLDivElement>(".modal-container"),
      this
    );
    this.focusManager.register(this.controlsModal);
  };

  protected getContent = () => {
    const d = document;
    const makeBtn = (text: string, onClick: () => void) => {
      const button = d.createElement("button");
      button.classList.add("smsh-button");
      button.style.width = "95%";
      button.innerText = text;
      button.onclick = onClick;
      return button;
    };
    const makeIconLink = (iconBasename: string, url: string) => {
      const a = d.createElement("a");
      a.href = url;
      const img = d.createElement("img");
      img.setAttribute("src", `${iconRoute}${iconBasename}`);
      img.setAttribute("width", "32px");
      a.appendChild(img);
      return a;
    }
    const options = d.createElement("div");
    options.style.display = "flex";
    options.style.flexDirection = "column";
    options.style.alignItems = "center";
    options.style.gap = "8px";

    options.append(
      makeBtn("Controls", () => {
        this.hide();
        this.focusManager.setFocus("controls");
        this.controlsModal.show();
      }),
      makeBtn("Exit game", () => (document.location = document.location)),
      makeIconLink("github.png", repoRoute),
    );

    return options;
  };
}

export class ControlsModal extends Modal implements IFocusable {
  constructor(container: HTMLDivElement, parent: Modal) {
    super(container, {
      title: "Controls",
      width: 500,
    });
    this.parent = parent;
  }
  parent: Modal;
  private focusManager: FocusManager;

  onClose = () => {
    this.focusManager.setFocus("menu");
    this.parent.show();
  };

  getFocusTag = () => "controls";
  onFocused = this.show;

  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (e, status) => {
    if (e.repeat) return;
    if (status == "down") {
      if (e.code == "Escape") this.hide();
    }
  };

  onFocusRegistered = (focusManager: FocusManager) => {
    this.focusManager = focusManager;
  };

  protected getContent = () => {
    const d = document;
    const content = d.createElement("div");

    content.innerHTML = `
    <h3>Control Scheme:</h3>
    <p><b>Arrows</b> - movement</p>
    <p><b>Space</b> - fire</p>
    <p><b>R</b> - respawn</p>
    <p><b>T</b> - focus on chat</p>
    <p><b>Escape</b> - open menu</p>
    <br />
    <h3>Tips and tricks:</h3>
    <p>Pressing down arrow whilst standing on semi-solid platforms lets you fall through them</p>
    <p>Quick tapping fire button does not let you fire faster. Just hold it down</p>
    <p>You can mute music by right clicking the browser tab and choosing "mute" option</p>
    `;

    return content;
  };
}

const initGameLayout = async () => {
  const client = new Client(`ws://${window.location.hostname}:5889`);

  const chat = new Chat(
    document.querySelector(".chat-container"),
    client.sendChatMessage
  );
  client.on("connRes", "main", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") {
      regModal.hide();
      client.getSceneMeta();
      focus.register(chat);
      audio.startSoundtrack("iceworld");
    }
  });
  client.on("serverChat", "chat", (data: IServerChatMessageExt) => {
    chat.receiveMessage(data.sender, data.message);
  });

  const audio = new AudioManager();
  audio.on("onStartedSoundtrack", "toast", (data) => {
    toast.notify(`smsh2 OST — ${data.name}`, "music");
  });

  const toast = new Toast(document.querySelector(".toast-container"));
  client.on("serverNotify", "toast", (data: IServerNotificationExt) =>
    toast.notify(data.message, data.type)
  );
  client.on("connRes", "toast", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed")
      toast.notify("successfully connected!", "info");
    else toast.notify("failed to connect!", "warning");
  });

  const easel = document.querySelector<HTMLDivElement>(".easel");
  const easelManager = new EaselManager(easel, client);

  const focus = new FocusManager();
  focus.register(client);
  client.on("connRes", "focus", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") focus.setFocus("client");
  });

  const menuModal = new GameMenuModal(
    document.querySelector<HTMLDivElement>(".modal-container")
  );
  focus.register(menuModal);

  const regModal = new RegModal(
    document.querySelector<HTMLDivElement>(".modal-container"),
    (clientName: string) => {
      if (clientName.trim()) client.connectByClientName(clientName);
    }
  );
  regModal.show();
};

initGameLayout();
