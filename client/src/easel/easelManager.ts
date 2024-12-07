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

    img.style.transform = `translate(${-prop.drawable.pivotOffsetX}px, ${-prop
      .drawable.pivotOffsetY}px)`;

    span.setAttribute("tag", prop?.nameTagged?.tag ?? "");
    span.className = "prop-sprite";

    span.style.top = prop.positioned.posY as unknown as string;
    span.style.left = prop.positioned.posX as unknown as string; // todo fix types

    span.id = prop.ID;
    span.appendChild(img);
    this.pivot.appendChild(span);
    const easelProp = {
      ...prop,
      container: span,
      lastMoved: new Date(),
    } satisfies IEaselProp;
    this.propList.push(easelProp);
  };

  private updateProps = (update: UpdateBehavioursExt) => {
    Object.entries(update)?.forEach(([propID, changes]) => {
      const prop = this.propList.find((prop) => prop.ID == propID);
      if (!prop) return;
      if (changes.positioned) {
        const dateMoved = new Date();
        prop.container.style.transition = `all ${
          dateMoved.getTime() - prop.lastMoved.getTime()
        }ms linear`;
        prop.container.style.top = (changes.positioned as any).posY;
        prop.container.style.left = (changes.positioned as any).posX;
        prop.lastMoved = dateMoved;
      }
    });
  };

  private deleteProps = (del: IExternalEvent["delete"]) => {
    for (let i = 0; i < this.propList.length; i++)
      if (del.includes(this.propList[i].ID)) {
        this.propList[i].container.remove();
        this.propList.splice(i, 1);
        return; // todo optimise this list traversal
      }
  };

  private onConnectHandler = (status: boolean) => {};
  private onSceneEventHandler = (data: IExternalEvent) => {
    console.log(data);
    data.load?.forEach((prop) => {
      if (prop.drawable) this.loadProp(prop);
    });
    if (data.update) this.updateProps(data.update); // todo fix concurrency here
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
  lastMoved: Date;
}
