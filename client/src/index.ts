import { IScoreUpdateExt } from "../../smshTypes/messages";
import {
  IConnectResponseMessageExt,
  IServerChatMessageExt,
  IServerNotificationExt,
  IServerSceneMetaMessageExt,
} from "../../types/messages";
import {
  AudioTrackEngine,
  AudioEventEngine,
  soundTrackMap,
} from "./audio/audioEngine.js";
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
import { ScoreBoardModal } from "./modal/scoreboard.js";
import { repoRoute } from "./routes.js";
import { Chat } from "./ui/chat.js";
import { Toast } from "./ui/toast.js";
import { makeIconButton, makeIconLink, pickRandom } from "./utils.js";
import { AudioWidget } from "./ui/audioWidget.js";

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
      getP("Players", `${data.currPlayerCount}/${data.maxPlayerCount}`)
    );
  };
}

// todo create unified menu modal factory
export class GameMenuModal extends Modal implements IFocusable {
  constructor(
    container: HTMLDivElement,
    audioTrackMgr: AudioTrackEngine,
    audioEventMgr: AudioEventEngine
  ) {
    super(container, {
      title: "Menu",
      width: 500,
    });
    this.audioWidget = new AudioWidget(audioTrackMgr, audioEventMgr);
  }
  private audioWidget: AudioWidget;
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
    const makeBtn = (text: string, onClick: () => void): HTMLButtonElement => {
      const button = document.createElement("button");
      button.classList.add("smsh-button");
      button.style.width = "95%";
      button.innerText = text;
      button.onclick = onClick;
      return button;
    };

    const content = document.createElement("div");

    const options = document.createElement("div");
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
      makeBtn(
        "Exit game",
        () => (document.location.href = document.location.href)
      ),
      makeIconLink("github.png", repoRoute)
    );

    content.append(this.audioWidget.audioWidget, options);

    return content;
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
      <ul>
      <li>Pressing down arrow whilst standing on semi-solid platforms lets you fall through them</li>
      <li>Quick tapping fire button does not let you fire faster. Just hold it down</li>
      </ul>`,
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
      audioTrackEng.playSound(pickRandom(playlist));
    }
  });
  client.on("serverChat", "chat", (data: IServerChatMessageExt) => {
    chat.receiveMessage(data.sender, data.message);
  });
  client.on("score", "self", (data: IScoreUpdateExt) => {
    scoreBoardModal.updateScore(data);
  });

  const audioTrackEng = new AudioTrackEngine();

  // todo let player build his own playlist
  const playlist: (keyof typeof soundTrackMap)[] = [
    "yeast soup",
    "bioluminescence",
    "ascend",
    "mycelium",
    "iceworld",
  ];
  audioTrackEng.on("onStartedSoundtrack", "toast", (name: string) => {
    toast.notify(audioTrackEng.getCurrentSoundTrackInfo(), "music");
  });
  audioTrackEng.on(
    "onEndedSoundtrack",
    "index",
    (name: keyof typeof soundTrackMap) => {
      let index = playlist.indexOf(name);
      index++;
      if (index >= playlist.length) index = 0;
      audioTrackEng.playSound(playlist[index]);
    }
  );

  const audioEventEng = new AudioEventEngine();

  const toast = new Toast(document.querySelector(".toast-container"));
  client.on("serverNotify", "toast", (data: IServerNotificationExt) =>
    toast.notify(data.message, data.type)
  );
  client.on("connRes", "toast", (data: IConnectResponseMessageExt) => {
    if (data.status != "allowed") {
      toast.notify("Failed to connect!", "warning");
      toast.notify(`Cause: ${data.cause}!`, "warning");
    }
  });

  const easel = document.querySelector<HTMLDivElement>(".easel");
  const easelManager = new EaselManager(easel, client, audioEventEng);

  const focus = new FocusManager();
  focus.register(client);
  client.on("connRes", "focus", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") focus.setFocus("client");
  });

  const menuModal = new GameMenuModal(
    document.querySelector<HTMLDivElement>(".modal-container"),
    audioTrackEng,
    audioEventEng
  );
  focus.register(menuModal);

  const scoreBoardModal = new ScoreBoardModal(
    document.querySelector<HTMLDivElement>(".modal-container"),
    client
  );
  focus.register(scoreBoardModal);

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
