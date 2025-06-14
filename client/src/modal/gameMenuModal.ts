import { AudioEventEngine, AudioTrackEngine } from "@client/audio/audioEngine";
import { FocusManager, IFocusable } from "@client/focus/focusManager";
import { repoRoute } from "@client/routes";
import { AudioWidget } from "@client/ui/audioWidget";
import { makeIconLink } from "@client/utils";
import { commitInfoToHtml, getLastCommitInfo } from "@client/versioning/github";
import { ControlsModal } from "@client/modal/controlsModal";
import { Modal } from "@client/modal/modal";

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
