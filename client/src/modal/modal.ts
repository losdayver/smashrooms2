import { iconRoute } from "@client/routes";
import { IDestructible } from "@client/common";
import {
  FocusManager,
  IFocusable,
  IFocusableTag,
} from "@client/focus/focusManager";

export interface IModalProps {
  width?: number;
  height?: number;
  title: string;
  noCloseButton?: boolean;
  modalStyle?: Partial<CSSStyleDeclaration>;
  overlayStyle?: Partial<CSSStyleDeclaration>;
}

export abstract class Modal {
  protected abstract getContent: () => HTMLElement;
  protected overlay: HTMLDivElement;
  protected container: HTMLDivElement;
  protected modal: HTMLDivElement;
  protected content: HTMLElement;
  private isInit = false;

  private init = () => {
    this.content.appendChild(
      this.getContent() ?? document.createElement("div")
    );
  };

  show = () => {
    if (!this.isInit) {
      this.init();
      this.isInit = true;
    }
    this.modal.classList.remove("modal--hidden");
    this.overlay.classList.remove("modal__overlay--hidden");
  };

  hide = () => {
    this.onClose();
    this.modal.classList.add("modal--hidden");
    this.overlay.classList.add("modal__overlay--hidden");
  };

  protected onClose = () => void 0;

  constructor(container: HTMLDivElement, props: IModalProps) {
    this.container = container;

    const overlay = document.createElement("div");
    overlay.classList.add("modal__overlay", "modal__overlay--hidden");
    this.overlay = overlay;

    if (props.overlayStyle)
      Object.entries(props.overlayStyle).forEach(([key, val]) => {
        overlay.style[key] = val;
      });

    const modal = document.createElement("div");
    modal.classList.add("modal", "modal--hidden");
    modal.style.setProperty("--input-width", "20em");
    modal.style.width = props.width?.toString?.() ?? "auto";
    modal.style.height = props.height?.toString?.() ?? "auto";

    if (props.modalStyle)
      Object.entries(props.modalStyle).forEach(([key, val]) => {
        modal.style[key] = val;
      });

    const controls = document.createElement("div");
    controls.classList.add("modal__controls");
    const title = document.createElement("div");
    title.innerText = props.title;
    title.classList.add("modal__controls__title");

    controls.append(title);

    if (!props?.noCloseButton) {
      const closeButton = document.createElement("div");
      closeButton.classList.add("modal__controls__close");
      closeButton.onclick = this.hide;
      closeButton.style.backgroundImage = `url(${iconRoute}cross.png)`;
      controls.append(closeButton);
    }

    const content = document.createElement("div");
    content.classList.add("modal__content");
    this.content = content;

    modal.append(controls, content);
    this.modal = modal;

    overlay.append(modal);

    container.append(overlay);
  }

  protected abstract getContent: () => HTMLElement;
  protected overlay: HTMLDivElement;
  protected container: HTMLDivElement;
  protected modal: HTMLDivElement;
  protected content: HTMLElement;
  private init = () => {
    this.content.appendChild(
      this.getContent() ?? document.createElement("div")
    );
  };
  private isInit = false;
  /** return false if want to block close attempt */
  protected onClose: () => void | false = () => void 0;
  protected _onClose = () => {
    return this.onClose();
  };

  show = () => {
    if (!this.isInit) {
      this.init();
      this.isInit = true;
    }
    this.modal.classList.remove("modal--hidden");
    this.overlay.classList.remove("modal__overlay--hidden");
  };
  hide = () => {
    if (this._onClose() === false) return;
    this.modal.classList.add("modal--hidden");
    this.overlay.classList.add("modal__overlay--hidden");
  };
}

export class EmptyModal extends Modal {
  protected getContent = () => null;
}

export interface IFocusableModalProps extends IModalProps {
  focusManager: FocusManager;
}

export abstract class FocusableModal
  extends Modal
  implements IFocusable, IDestructible
{
  constructor(container: HTMLDivElement, props: IFocusableModalProps) {
    super(container, props);
    const { focusManager } = props;
    this.focusManager = focusManager;
    this.lastFocusedTag = this.focusManager.getCurrentTag();
    this.focusTag = Symbol();
    focusManager.register(this);
    focusManager.setFocus(this.getFocusTag());

    const originalOnClose = this._onClose;
    this._onClose = () => {
      const closeRes = originalOnClose();
      if (closeRes == false) return;
      this.focusManager.setFocus(this.lastFocusedTag);
      this.focusManager.unregister(this);
      this.destructor();
    };
  }
  destructor() {
    this.overlay.remove();
  }

  private focusTag: symbol;
  private lastFocusedTag: IFocusableTag;
  private focusManager: FocusManager;

  getFocusTag = () => this.focusTag;
  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (key, status) =>
    status == "down" && key == "back" && this.hide();
}
