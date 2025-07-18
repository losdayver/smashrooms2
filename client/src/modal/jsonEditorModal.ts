import { AudioEventEngine, AudioTrackEngine } from "@client/audio/audioEngine";
import { FocusManager, IFocusable } from "@client/focus/focusManager";
import { Modal } from "@client/modal/modal";
import { Toast } from "@client/ui/toast";

export class JsonEditorModal extends Modal implements IFocusable {
  constructor(
    container: HTMLDivElement,
    focusManager: FocusManager,
    toast: Toast,
    targetObjRef: { ref: object }
  ) {
    super(container, {
      title: "Prop editor",
      width: 550,
    });
    this.focusManager = focusManager;
    this.toast = toast;
    this.targetObjRef = targetObjRef;
  }
  private focusManager: FocusManager;
  private toast: Toast;
  private targetObjRef: { ref: object };
  private textArea: HTMLTextAreaElement;

  onClose = (): false => {
    try {
      const obj = JSON.parse(this.textArea.value);
      this.targetObjRef.ref = obj;
    } catch (e) {
      this.showFormatError();
      console.error(e);
      return false;
    }
    this.focusManager.setFocus("canvas");
    this.destroy();
  };

  getFocusTag = () => "jsonEditor";
  onFocused = this.show;

  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (key, status) => {
    if (status == "down") {
      if (key == "back") this.hide();
    }
  };

  onFocusRegistered = (focusManager: FocusManager) => {
    this.focusManager = focusManager;
  };

  private formatTextArea = () => {
    try {
      const obj = JSON.parse(this.textArea.value);
      this.textArea.value = JSON.stringify(obj, null, 2);
    } catch (e) {
      this.showFormatError();
      console.error(e);
    }
  };

  private showFormatError = () => {
    this.toast.notify("Unable to format JSON!", "danger");
  };

  protected getContent = () => {
    const formatButton = document.createElement("button") as HTMLButtonElement;
    formatButton.classList.add("smsh-button");
    formatButton.onclick = this.formatTextArea;
    formatButton.innerText = "format";
    const textArea = document.createElement("textArea") as HTMLTextAreaElement;
    this.textArea = textArea;
    textArea.style.width = "500px";
    textArea.style.height = "500px";
    textArea.style.resize = "none";
    textArea.style.fontWeight = "bold";
    textArea.style.fontSize = "14pt";
    textArea.value = JSON.stringify(this.targetObjRef.ref, null, 2);
    const content = document.createElement("div");
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.justifyContent = "center";
    content.style.alignItems = "center";
    content.append(formatButton, textArea);
    return content;
  };
}
