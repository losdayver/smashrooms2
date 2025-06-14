import { AudioEventEngine, AudioTrackEngine } from "../audio/audioEngine.js";
import { FocusManager, IFocusable } from "../focus/focusManager.js";
import { repoRoute } from "../routes.js";
import { AudioWidget } from "../ui/audioWidget.js";
import { makeIconLink } from "../utils.js";
import { commitInfoToHtml, getLastCommitInfo } from "../versioning/github.js";
import { ControlsModal } from "./controlsModal.js";
import { Modal } from "./modal.js";

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
      makeIconLink("github.png", repoRoute, true)
    );

    content.append(this.audioWidget.audioWidget, options);

    return content;
  };
}
