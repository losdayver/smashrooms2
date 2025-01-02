import { iconRoute } from "../routes.js";

export abstract class Modal {
  protected abstract getContent: () => HTMLElement;
  protected container: HTMLDivElement;
  protected modal: HTMLDivElement;
  protected content: HTMLElement;

  private init = () => {
    this.content.appendChild(
      this.getContent() ?? document.createElement("div")
    );
  };
  private isInit = false;

  show = () => {
    if (!this.isInit) {
      this.init();
      this.isInit = true;
    }
    this.modal.classList.remove("modal--hidden");
  };
  hide = () => {
    this.modal.classList.add("modal--hidden");
  };

  constructor(container: HTMLDivElement, props: IModalProps) {
    this.container = container;

    const d = document;
    const modal = d.createElement("div");
    modal.classList.add("modal", "modal--hidden");

    modal.style.setProperty("--input-width", "20em");

    modal.style.width = props.width.toString();
    modal.style.height = props.height?.toString?.() ?? "auto";

    const controls = d.createElement("div");
    controls.classList.add("modal__controls");
    const title = d.createElement("div");
    title.innerText = props.title;
    title.classList.add("modal__controls__title");

    controls.append(title);

    if (!props?.noCloseButton) {
      const closeButton = d.createElement("div");
      closeButton.classList.add("modal__controls__close");
      closeButton.onclick = this.hide;
      closeButton.style.backgroundImage = `url(${iconRoute}cross.png)`;
      controls.append(closeButton);
    }

    const content = d.createElement("div");
    content.classList.add("modal__content");
    this.content = content;

    modal.append(controls, content);
    this.modal = modal;

    container.append(modal);
  }
}

export interface IModalProps {
  width: number;
  height?: number;
  title: string;
  noCloseButton?: boolean;
}

export class EmptyModal extends Modal {
  protected getContent = () => null;
}
