import {
  IConnectResponseMessageExt,
  ISceneUpdatesMessageExt,
} from "../../../types/messages";
import {
  IBehaviouredPropExt,
  ISceneUpdatesMessageData,
} from "../../../types/sceneTypes";
import { StageExt } from "../../../types/stage";
import { Client } from "../client/client.js";
import {
  backgroundRoute,
  layoutSpriteRoute,
  propSpriteRoute,
} from "../routes.js";

export class EaselManager {
  private easelDiv: HTMLDivElement | HTMLSpanElement;
  private pivot: HTMLDivElement;
  private layoutPivot: HTMLDivElement;
  private propList: IEaselProp[] = [];
  private stage: StageExt;
  client: Client;

  private loadProp = (prop: IBehaviouredPropExt) => {
    const img = document.createElement("img");
    const container = document.createElement("span");
    img.src = `${propSpriteRoute}${prop.drawable.animationCode}.gif`;

    container.style.transform = `translate(${-prop.drawable
      .pivotOffsetX}px, ${-prop.drawable.pivotOffsetY}px)`;

    container.setAttribute("tag", prop?.nameTagged?.tag ?? "");

    container.className = "easel__prop-sprite";

    container.style.top = prop.positioned.posY.toString();
    container.style.left = prop.positioned.posX.toString();

    container.id = prop.ID;
    container.appendChild(img);
    this.pivot.appendChild(container);

    const easelProp = {
      ...prop,
      container,
      img,
      lastMoved: new Date(),
    } satisfies IEaselProp;
    this.propList.push(easelProp);
  };

  private updateProps = (update: ISceneUpdatesMessageData["update"]) => {
    Object.entries(update)?.forEach(([propID, changes]) => {
      const prop = this.propList.find((prop) => prop.ID == propID);
      if (!prop) return;

      if (changes.positioned) {
        const dateMoved = new Date();
        const transitionTime =
          dateMoved.getTime() - prop.lastMoved.getTime() || 0;
        prop.container.style.transition = `all ${
          transitionTime > 100 ? 0 : transitionTime
        }ms linear`;

        if (changes.positioned.posY)
          prop.container.style.top = changes.positioned.posY.toString();

        if (changes.positioned.posX)
          prop.container.style.left = changes.positioned.posX.toString();

        prop.lastMoved = dateMoved;
      }

      if (changes.drawable) {
        if (changes.drawable.animationCode)
          prop.img.src = `${propSpriteRoute}${changes.drawable.animationCode}.gif`;

        if (changes.drawable.facing) {
          if (changes.drawable.facing == "left")
            prop.img.style.transform = "scaleX(-1)";
          else prop.img.style.transform = "";
        }
      }
    });
  };

  private deleteProps = (del: ISceneUpdatesMessageData["delete"]) => {
    for (const propToDeleteID of del) {
      this.propList.forEach((prop, index) => {
        if (propToDeleteID == prop.ID) {
          prop.container.remove();
          this.propList.splice(index, 1);
          return;
        }
      });
    }
  };

  private animateProps = (anim: ISceneUpdatesMessageData["anim"]) => {
    while (anim.length) {
      const a = anim.pop();
      const prop = this.propList.find((prop) => prop.ID == a.ID);
      if (prop) {
        const animClass = `easel__prop-sprite--${a.name}`;
        prop.img.classList.remove(animClass);
        void prop.img.offsetWidth;
        prop.img.classList.add(animClass);
      }
    }
  };

  private onConnectHandler = (status: boolean) => {};
  private onSceneEventHandler = (data: ISceneUpdatesMessageData) => {
    data.load?.forEach((prop) => {
      if (prop.drawable) this.loadProp(prop);
    });
    if (data.update) this.updateProps(data.update);
    if (data.delete) this.deleteProps(data.delete);
    if (data.anim) this.animateProps(data.anim);
  };

  constructStage = (stage: StageExt) => {
    const tileSize = 32; // todo define this somewhere
    this.layoutPivot = document.createElement("div") as HTMLDivElement;
    this.layoutPivot.style.position = "relative";
    this.stage = this.stage;

    stage.layoutData.split(/\r\n|\r|\n/).forEach((line, y) => {
      for (let x = 0; x < line.length; x++) {
        const char = line[x];
        if (char != " ") {
          const img = document.createElement("img") as HTMLImageElement;
          img.src = `${layoutSpriteRoute}${layoutTileMap[char].imgSrc}`;
          img.className = "easel__layout-tile";
          img.style.top = (y * tileSize).toString();
          img.style.left = (x * tileSize).toString();
          this.layoutPivot.appendChild(img);
        }
      }
    });

    this.easelDiv.style.backgroundImage = `url(${backgroundRoute}forest.png)`;
    this.easelDiv.appendChild(this.layoutPivot);
  };

  constructor(
    easelDiv: HTMLDivElement | HTMLSpanElement,
    client: Client,
    stage?: StageExt
  ) {
    this.easelDiv = easelDiv;

    this.pivot = document.createElement("div");
    this.pivot.style.zIndex = "99";

    if (stage) this.constructStage(stage);

    easelDiv.appendChild(this.pivot);
    this.pivot.style.position = "relative";
    this.client = client;

    client.on("connRes", "easel", (data: IConnectResponseMessageExt) =>
      this.onConnectHandler(data.status == "allowed")
    );
    client.on("scene", "easel", (data: ISceneUpdatesMessageExt) =>
      this.onSceneEventHandler(data.data)
    );
  }
}

interface IEaselProp extends IBehaviouredPropExt {
  container: HTMLSpanElement;
  img: HTMLImageElement;
  lastMoved: Date;
}

interface ILayoutTile {
  imgSrc: string;
}

const layoutTileMap: Record<string, ILayoutTile> = {
  "#": {
    imgSrc: "bricks.png",
  },
  "=": {
    imgSrc: "metalBeam.png",
  },
  G: {
    imgSrc: "deepGround.png",
  },
  g: {
    imgSrc: "grass.png",
  },
  l: {
    imgSrc: "leaves.png",
  },
  s: {
    imgSrc: "stone.png",
  },
  m: {
    imgSrc: "metal.png",
  },
  b: {
    imgSrc: "box.png",
  },
};
