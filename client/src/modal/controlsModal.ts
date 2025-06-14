import {
  ControlsConfig,
  controlsList,
  ControlsObjType,
  defaultControlsObj,
} from "@client/config/config";
import { FocusManager, IFocusable } from "@client/focus/focusManager";
import { Modal } from "@client/modal/modal";

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
