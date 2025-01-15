import {
  IConnectResponseMessageExt,
  IServerChatMessageExt,
  IServerNotificationExt,
  IServerSceneMetaMessageExt,
} from "../../types/messages";
import { AudioManager } from "./audio/audioManager.js";
import { Client } from "./client/client.js";
import {
  ControlsConfig,
  controlsList,
  ControlsObjType,
  defaultControlsObj,
} from "./config/config.js";
import { EaselManager } from "./easel/easelManager.js";
import { FocusManager, IFocusable } from "./focus/focusManager.js";
import { Modal } from "./modal/modal.js";
import { repoRoute } from "./routes.js";
import { Chat } from "./ui/chat.js";
import { Toast } from "./ui/toast.js";
import { makeIconButton, makeIconLink } from "./utils.js";

export class RegModal extends Modal {
  private onSubmit: (clientName: string) => void;
  private client: Client;
  constructor(
    container: HTMLDivElement,
    onSubmit: (clientName: string) => void,
    client: Client
  ) {
    super(container, {
      title: "Enter game",
      width: 500,
      noCloseButton: true,
    });
    this.client = client;
    this.onSubmit = onSubmit;
    client.on("socketOpen", "index", () => {
      client.getSceneMeta();
    });

    client.on(
      "serverSceneMeta",
      "regModal",
      (data: IServerSceneMetaMessageExt) => {
        this.updateServerInfo(data);
      }
    );
  }

  private infoContainer: HTMLDivElement;

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

    this.infoContainer = document.createElement("div");

    form.append(this.infoContainer, label, submit);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onSubmit(input.value);
    });
    form.classList.add("shmsh-form");

    return form;
  };

  private updateServerInfo = (data: IServerSceneMetaMessageExt) => {
    const d = document;
    const getP = (title: string, contents: any) => {
      const p = d.createElement("p");
      const b = d.createElement("b");
      b.innerText = contents ?? "";
      p.append(title, ": ", b);
      p.style.textAlign = "center";
      return p;
    };
    const reload = makeIconButton("reload.png", this.client.getSceneMeta);
    reload.style.position = "absolute";
    reload.style.top = "8";
    reload.style.left = "8";
    this.infoContainer.innerHTML = "";
    this.infoContainer.append(
      reload,
      getP("Stage name", data.stageName),
      getP("Author", data.stageAuthor),
      getP("Player count", data.currPlayerCount),
      getP("Max players", data.maxPlayerCount)
    );
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

  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (key, status) => {
    if (status == "down") {
      if (key == "back") this.hide();
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
      makeIconLink("github.png", repoRoute)
    );

    return options;
  };
}

export class ControlsModal extends Modal implements IFocusable {
  private controlsConfig = new ControlsConfig();
  constructor(container: HTMLDivElement, parent: Modal) {
    super(container, {
      title: "Controls",
      width: 700,
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

  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (
    key,
    status,
    realKeyCode
  ) => {
    if (status == "down") {
      if (key == "back" && !this.currentControlButtonRef) this.hide();
      else {
        if (this.currentControlButtonRef) {
          let newControlList = [
            ...new Set(
              this.controlsConfig
                .getValue(this.currentControlKey)
                .concat(realKeyCode)
            ),
          ];
          this.controlsConfig.setValue(this.currentControlKey, newControlList);
          this.currentControlButtonRef.innerText = newControlList.join(", ");
          this.currentControlButtonRef.classList.remove(
            "smsh-button--activated"
          );
          this.currentControlButtonRef = null;
          this.currentControlKey = null;
        }
      }
    }
  };

  onFocusRegistered = (focusManager: FocusManager) => {
    this.focusManager = focusManager;
  };

  private currentControlButtonRef: HTMLDivElement;
  private currentControlKey: keyof ControlsObjType;
  private controlButtonList: HTMLDivElement[] = [];

  protected getContent = () => {
    const d = document;
    const content = d.createElement("div");

    const getControls = () => {
      return controlsList.map((controlKey) => {
        const controlDiv = Object.assign(d.createElement("div"));
        controlDiv.style.display = "flex";
        controlDiv.style.justifyContent = "space-between";
        controlDiv.style.gap = "8px";
        controlDiv.style.marginBottom = "8px";
        const controlTitle = Object.assign(d.createElement("p"), {
          innerText: controlKey,
        });
        controlTitle.style.flexBasis = "60px";
        const controlButton = Object.assign(d.createElement("div"), {
          className: "smsh-button",
          innerText: this.controlsConfig.getValue(controlKey).join(", "),
        });
        controlButton.style.flex = "1";
        controlButton.style.textAlign = "center";
        this.controlButtonList.push(controlButton);
        controlButton.onclick = () => {
          this.currentControlButtonRef?.classList.remove(
            "smsh-button--activated"
          );
          if (this.currentControlButtonRef == controlButton) {
            this.currentControlButtonRef = null;
            this.currentControlKey = null;
            return;
          }
          this.currentControlButtonRef = controlButton;
          this.currentControlKey = controlKey;
          this.currentControlButtonRef.classList.add("smsh-button--activated");
        };
        controlButton.onauxclick = (ev) => {
          if (ev.button == 0) return;
          else if (ev.button == 2) this.controlsConfig.setValue(controlKey, []);
          controlButton.innerText = "";
          controlButton.classList.remove("smsh-button--activated");
          this.currentControlButtonRef = null;
          this.currentControlKey = null;
        };
        const resetButton = Object.assign(d.createElement("div"), {
          innerText: "reset",
          className: "smsh-button",
        });
        resetButton.onclick = () => {
          this.controlsConfig.setValue(
            controlKey,
            defaultControlsObj[controlKey]
          );
          controlButton.innerText = this.controlsConfig
            .getValue(controlKey)
            .join(", ");
          controlButton.classList.remove("smsh-button--activated");
          this.currentControlButtonRef?.classList.remove(
            "smsh-button--activated"
          );
          this.currentControlButtonRef = null;
          this.currentControlKey = null;
        };
        controlDiv.append(controlTitle, controlButton, resetButton);
        return controlDiv;
      });
    };

    const headerDiv = Object.assign(d.createElement("div"), {
      innerHTML: `<h3>How to use:</h3>
      <p>Use left mouse button to select what control to change</p>
      <p>Right mouse button to clear</p>
    `,
    });

    const tipsDiv = Object.assign(d.createElement("div"), {
      innerHTML: `<h3>Tips and tricks:</h3>
      <p>Pressing down arrow whilst standing on semi-solid platforms lets you fall through them</p>
      <p>Quick tapping fire button does not let you fire faster. Just hold it down</p>
      <p>You can mute music by right clicking the browser tab and choosing "mute" option</p>`,
    });

    content.append(headerDiv, ...getControls(), tipsDiv);

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
    if (data.status != "allowed") {
      toast.notify("failed to connect!", "warning");
      toast.notify("cause: " + data.cause, "warning");
    }
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
    },
    client
  );
  regModal.show();
};

window.addEventListener(`contextmenu`, (e) => e.preventDefault());
initGameLayout();
