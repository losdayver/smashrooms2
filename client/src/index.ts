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
import { repoRoute } from "./routes.js";
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

  onFocusRegistered = (focusManager: FocusManager) => {
    this.focusManager = focusManager;
  };

  protected getContent = () => {
    const d = document;
    const makeBtn = (text: string, onClick: () => void) => {
      const button = d.createElement("button");
      button.classList.add("smsh-button");
      button.innerText = text;
      button.onclick = onClick;
      return button;
    };
    const options = d.createElement("div");
    options.style.display = "flex";
    options.style.flexDirection = "column";
    options.style.gap = "8px";

    options.append(
      makeBtn("Controls", () => {}),
      makeBtn("Visit repo", () => {
        document.location = repoRoute;
      }),
      makeBtn("Exit game", () => (document.location = document.location)),
      makeBtn("Close menu", this.hide)
    );

    return options;
  };
}

const initGameLayout = async () => {
  const client = new Client(`ws://${window.location.hostname}:5889`);

  const chat = new Chat(
    document.querySelector(".chat-container"),
    client.sendChatMessage
  );
  client.on("connRes", "main", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") regModal.hide();
    client.getSceneMeta();
    focus.register(chat);
    audio.startSoundtrack("iceworld");
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
    (clientName: string) => client.connectByClientName(clientName)
  );
  regModal.show();
};

initGameLayout();
