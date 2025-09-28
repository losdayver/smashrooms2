import { FocusManager } from "@client/focus/focusManager";
import { FocusableModal } from "@client/modal/modal";
import { Toast } from "@client/ui/toast";

export class JsonEditorModal extends FocusableModal {
  constructor(
    container: HTMLDivElement,
    focusManager: FocusManager,
    toast: Toast,
    targetObjRef: { ref: object },
    onClose?: () => void
  ) {
    super(container, {
      title: "Object editor",
      width: 550,
      focusManager,
    });
    this.toast = toast;
    this.targetObjRef = targetObjRef;
    this.callbackOnClose = onClose;
  }
  private toast: Toast;
  private targetObjRef: { ref: object };
  private textArea: HTMLTextAreaElement;
  private callbackOnClose: () => void;

  onClose = (): false => {
    try {
      const obj = JSON.parse(this.textArea.value);
      this.targetObjRef.ref = obj;
      this.callbackOnClose?.();
    } catch (e) {
      this.showFormatError();
      console.error(e);
      return false;
    }
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
