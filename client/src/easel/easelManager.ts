import {
  IBehaviouredPropExt,
  IExternalEvent,
  UpdateBehavioursExt,
} from "../../../types/sceneTypes";
import { Client } from "../client/client.js";
import { propSpriteRoute } from "../routes.js";

export class EaselManager {
  private pivot: HTMLDivElement;
  private propList: IEaselProp[] = [];
  client: Client;

  private loadProp = (prop: IBehaviouredPropExt) => {
    const img = document.createElement("img");
    const span = document.createElement("span");
    img.src = `${propSpriteRoute}${prop.drawable.animationCode}.png`;
    span.setAttribute("tag", prop?.nameTagged?.tag ?? "");
    span.className = "prop-sprite";
    span.style.top = prop.positioned.posY as unknown as string;
    span.style.left = prop.positioned.posX as unknown as string;
    span.id = prop.ID;
    span.appendChild(img);
    this.pivot.appendChild(span);
    const easelProp = {
      ...prop,
      container: span,
    } satisfies IEaselProp;
    this.propList.push(easelProp);
  };

  private updateProps = (update: UpdateBehavioursExt) => {
    Object.entries(update)?.forEach(([propID, changes]) => {
      const el = document.getElementById(propID);
      if (!el) return;
      if (changes.positioned) {
        el.style.top = (changes.positioned as any).posY;
        el.style.left = (changes.positioned as any).posX;
      }
    });
  };

  private deleteProps = (del: IExternalEvent["delete"]) => {
    for (let i = 0; i < del.length; i++)
      for (let j = 0; j < this.propList.length; j++)
        if (del.includes(this.propList[j].ID)) {
          this.propList[j].container.remove();
          this.propList.splice(j, 1);
          return; // todo optimise this list traversal
        }
  };

  private onConnectHandler = (status: boolean) => {};
  private onSceneEventHandler = (data: IExternalEvent) => {
    data.load?.forEach((prop) => {
      if (prop.drawable) this.loadProp(prop);
    });
    if (data.update) this.updateProps(data.update);
    if (data.delete) this.deleteProps(data.delete);
  };

  constructor(easelDiv: HTMLDivElement | HTMLSpanElement, client: Client) {
    this.pivot = document.createElement("div");
    easelDiv.appendChild(this.pivot);
    this.pivot.style.position = "relative";
    this.client = client;

    client.onConnectHandlers.easel = this.onConnectHandler;
    client.onSceneEventHandlers.easel = this.onSceneEventHandler;
  }
}

interface IEaselProp extends IBehaviouredPropExt {
  container: HTMLElement;
}
