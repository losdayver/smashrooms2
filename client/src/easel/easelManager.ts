import {
  IConnectResponseMessageExt,
  ISceneUpdatesMessageExt,
  IServerSceneMetaMessageExt,
  ISoundMessageExt,
} from "../../../types/messages";
import {
  IBehaviouredPropExt,
  IDamageableExt,
  ISceneUpdatesMessageData,
} from "../../../types/sceneTypes";
import { StageExt } from "../../../types/stage";
import { AudioEventManager, soundEventMap } from "../audio/audioManager.js";
import { Client } from "../client/client.js";
import {
  backgroundRoute,
  layoutSpriteRoute,
  propSpriteRoute,
  stagesRoute,
} from "../routes.js";

export class EaselManager {
  private easelDiv: HTMLDivElement | HTMLSpanElement;
  private pivot: HTMLDivElement;
  private layoutPivot: HTMLDivElement;
  private propList: IEaselProp[] = [];
  private stage: StageExt;
  private currentStageWidth: number;
  client: Client;
  private clientPropNameTag: string;
  private clientPropID: string;
  private static readonly defaultNicknameHighlightColor = "yellow";
  audioEventMgr: AudioEventManager;

  private readonly loadPropSoundMap: Partial<
    Record<string, keyof typeof soundEventMap>
  > = {
    bullet: "bullet",
    fist: "punchAir",
    rocket: "bazookaShot",
    explosion: "bazookaExplosion",
    plasma: "blaster",
    sniperBullet: "sniperBullet",
  } as const;

  private loadProp = (prop: IBehaviouredPropExt) => {
    const img = document.createElement("img");
    const container = document.createElement("span");
    img.src = `${propSpriteRoute}${prop.drawable.sprite}.gif`;

    container.style.transform = `translate(${-prop.drawable.offsetX}px, ${-prop
      .drawable.offsetY}px)`;

    container.setAttribute("tag", prop?.nameTagged?.tag ?? "");
    container.className = "easel__prop-sprite";

    container.style.top = prop.positioned.posY.toString();
    container.style.left = prop.positioned.posX.toString();

    container.id = prop.ID;

    const easelProp = {
      ...prop,
      container,
      img,
      lastMoved: new Date(),
    } satisfies IEaselProp;

    this.processDrawable(easelProp, prop);

    this.propList.push(easelProp);

    container.appendChild(img);
    this.pivot.appendChild(container);

    if (prop.damageable) this.updateHealth(easelProp, prop as IDamageableExt);

    const sound = this.loadPropSoundMap[prop.drawable?.sprite];
    if (sound) this.audioEventMgr.playSound(sound);

    if (prop.nameTagged?.tag == this.clientPropNameTag) {
      this.clientPropID = prop.ID;
      if (this.clientPropID == prop.ID) container.classList.add("you");
    }
  };

  private updateProps = (update: ISceneUpdatesMessageData["update"]) => {
    Object.entries(update)?.forEach(([propID, changes]) => {
      const easelProp = this.propList.find(
        (easelProp) => easelProp.ID == propID
      );
      if (!easelProp) return;
      if (changes.damageable)
        this.updateHealth(easelProp, changes as IDamageableExt);
      if (changes.positioned) {
        const dateMoved = new Date();
        const transitionTime =
          dateMoved.getTime() - easelProp.lastMoved.getTime() || 0;
        easelProp.container.style.transition = `all ${
          transitionTime > 100 ? 0 : transitionTime
        }ms linear`;
        if (changes.positioned.posY)
          easelProp.container.style.top = changes.positioned.posY.toString();
        if (changes.positioned.posX)
          easelProp.container.style.left = changes.positioned.posX.toString();
        easelProp.lastMoved = dateMoved;
      }
      this.processDrawable(easelProp, changes as any);
    });
  };

  private readonly deletePropSoundMap: Partial<
    Record<string, keyof typeof soundEventMap>
  > = {
    medikit: "itemPickup",
    bazooka: "itemPickup",
    pistol: "itemPickup",
    shotgun: "itemPickup",
    blaster: "itemPickup",
    sniper: "itemPickup",
  } as const;

  private deleteProps = (del: ISceneUpdatesMessageData["delete"]) => {
    for (const propToDeleteID of del) {
      this.propList.forEach((prop, index) => {
        if (propToDeleteID == prop.ID) {
          const sound = this.deletePropSoundMap[prop.drawable.sprite];
          if (sound) this.audioEventMgr.playSound(sound);
          prop.container.remove();
          this.propList.splice(index, 1);
          return;
        }
      });
    }
  };

  private readonly animatePropSoundMap: Partial<
    Record<string, keyof typeof soundEventMap>
  > = {
    hit: "hit",
    heal: "heal",
  } as const;

  private animateProps = (anim: ISceneUpdatesMessageData["anim"]) => {
    while (anim.length) {
      const a = anim.pop();
      const prop = this.propList.find((prop) => prop.ID == a.ID);
      if (prop) {
        const sound = this.animatePropSoundMap[a.name];
        if (sound) this.audioEventMgr.playSound(sound);
        const animClass = `easel__prop-sprite--${a.name}`;
        prop.img.className = "";
        void prop.img.offsetWidth;
        prop.img.className = animClass;
      }
    }
  };

  private processDrawable = (
    easelProp: IEaselProp,
    update: IBehaviouredPropExt
  ) => {
    if (!update.drawable) return;
    if (update.drawable.sprite)
      easelProp.img.src = `${propSpriteRoute}${update.drawable.sprite}.gif`;

    const overlayPostfixes = [0, 1];

    if (update.drawable.facing) {
      if (update.drawable.facing == "left") {
        easelProp.img.style.transform = "scaleX(-1)";
        overlayPostfixes.forEach((num) => {
          if (easelProp[`overlay${num}`])
            easelProp[`overlay${num}`].querySelector<HTMLImageElement>(
              ".easel__prop-overlay__img"
            ).style.transform = "scaleX(-1)";
        });
      } else {
        easelProp.img.style.transform = "";
        overlayPostfixes.forEach((num) => {
          if (easelProp[`overlay${num}`])
            easelProp[`overlay${num}`].querySelector<HTMLImageElement>(
              ".easel__prop-overlay__img"
            ).style.transform = "";
        });
      }
    }

    if (update.drawable.anim) {
      const animClass = `easel__prop-sprite--${update.drawable.anim}`;
      easelProp.img.className = animClass;
    }

    const updateOverlay = (overlayNum: number) => {
      if (update.drawable[`overlay${overlayNum}`]) {
        if (!easelProp[`overlay${overlayNum}`]) {
          const overlay = document.createElement("div");
          overlay.className = "easel__prop-overlay";
          overlay.style.zIndex = (overlayNum + 1).toString();
          const overlayImg = document.createElement("img");
          overlayImg.className = "easel__prop-overlay__img";
          overlay.appendChild(overlayImg);
          easelProp.container.appendChild(overlay);
          easelProp[`overlay${overlayNum}`] = overlay;
        }
        const overlayImg = easelProp[
          `overlay${overlayNum}`
        ].querySelector<HTMLImageElement>(".easel__prop-overlay__img");
        overlayImg.style.transform = easelProp.img.style.transform;
        easelProp[`overlay${overlayNum}`].style.top = `${
          update.drawable[`overlay${overlayNum}`].y
        }px`;
        overlayImg.src = `${propSpriteRoute}${
          update.drawable[`overlay${overlayNum}`].sprite
        }.gif`;
      } else if (
        update.drawable[`overlay${overlayNum}`] === null &&
        easelProp[`overlay${overlayNum}`]
      ) {
        easelProp[`overlay${overlayNum}`].remove();
        easelProp[`overlay${overlayNum}`] = undefined;
      }
    };

    overlayPostfixes.forEach(updateOverlay);
  };

  private updateHealth = (easelProp: IEaselProp, update: IDamageableExt) => {
    if (!easelProp.healthBar) {
      easelProp.healthBar = document.createElement("div");
      easelProp.healthBar.className = "easel__prop-sprite__health-bar";
      const healthValueBar = document.createElement("div");
      healthValueBar.className = "easel__prop-sprite__health-bar__value";
      easelProp.healthBar.appendChild(healthValueBar);
      easelProp.container.appendChild(easelProp.healthBar);
    }
    if (update.damageable.maxHealth)
      easelProp.maxHealth = update.damageable.maxHealth;
    const healthValueBar = easelProp.healthBar.querySelector<HTMLDivElement>(
      ".easel__prop-sprite__health-bar__value"
    );
    const healthPercentage =
      (update.damageable.health * 100) / easelProp.maxHealth;
    healthValueBar.style.width = `${healthPercentage}%`;
    healthValueBar.style.background =
      EaselManager.calculateHealthColor(healthPercentage);
    easelProp.healthBar.classList.remove("easel__prop-sprite--appear-dissolve");
    void easelProp.healthBar.offsetWidth;
    easelProp.healthBar.classList.add("easel__prop-sprite--appear-dissolve");
  };

  private static calculateHealthColor = (healthPercentage: number): string => {
    return `rgb(
      ${Math.floor(255 - healthPercentage * 2.05)},
      ${Math.floor(255 - (100 - healthPercentage) * 2.55)},
      ${Math.floor(50 - (100 - healthPercentage) / 2)}
    `;
  };

  private onConnectHandler = (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") {
      this.clientPropNameTag = data.nameTag;
    }
  };

  private onSceneEventHandler = (data: ISceneUpdatesMessageData) => {
    data.load?.forEach((prop) => {
      if (prop.drawable) this.loadProp(prop);
    });
    if (data.update) this.updateProps(data.update);
    if (data.delete) this.deleteProps(data.delete);
    if (data.anim) this.animateProps(data.anim);
  };

  private updateEaselScale = () => {
    if (!this.currentStageWidth) return;
    const scaleFactor =
      window.innerWidth / (this.currentStageWidth * this.stage.meta.gridSize);
    this.easelDiv.style.transform = `scale(${scaleFactor})`;
  };

  private constructStage = (stage: StageExt) => {
    const tileSize = stage.meta.gridSize;
    this.layoutPivot = document.createElement("div") as HTMLDivElement;
    this.layoutPivot.style.position = "relative";
    this.stage = stage;
    let width: number;
    stage.layoutData.split(/\r\n|\r|\n/).forEach((line, y) => {
      width ??= line.length;
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
    this.currentStageWidth = width; // todo maybe put this in one nice object
    this.updateEaselScale();
    document.querySelector(
      "body"
    ).style.backgroundImage = `url(${backgroundRoute}forest.png)`;
    this.easelDiv.appendChild(this.layoutPivot);
  };

  constructor(
    easelDiv: HTMLDivElement | HTMLSpanElement,
    client: Client,
    audioEventMgr: AudioEventManager
  ) {
    this.easelDiv = easelDiv;
    this.audioEventMgr = audioEventMgr;

    this.pivot = document.createElement("div");
    this.pivot.style.zIndex = "99";

    easelDiv.appendChild(this.pivot);
    this.pivot.style.position = "relative";
    this.client = client;

    client.on("connRes", "easel", (data: IConnectResponseMessageExt) =>
      this.onConnectHandler(data)
    );
    client.on("scene", "easel", (data: ISceneUpdatesMessageExt) =>
      this.onSceneEventHandler(data.data)
    );
    client.on(
      "serverSceneMeta",
      "easel",
      async (data: IServerSceneMetaMessageExt) => {
        if (!client.isRegistered) return;
        const layoutString = (await fetch(
          `${stagesRoute}${data.stageSystemName}/${data.stageSystemName}.layout`
        )
          .then((data) => data)
          .then((data) => data.text())) as string;
        const layoutMeta = (await fetch(
          `${stagesRoute}${data.stageSystemName}/${data.stageSystemName}.meta.json`
        )
          .then((data) => data)
          .then((data) => data.json())) as StageExt["meta"];
        const stage: StageExt = {
          layoutData: layoutString,
          meta: layoutMeta,
        };

        this.constructStage(stage);
      }
    );
    this.easelDiv.style.setProperty(
      "--easel__prop-sprite--border-color",
      EaselManager.defaultNicknameHighlightColor
    );
    client.on("sound", "self", (data: ISoundMessageExt) => {
      this.audioEventMgr.playSound(data.sound as keyof typeof soundEventMap);
    });
    window.addEventListener("resize", this.updateEaselScale);
  }
}

interface IEaselProp extends IBehaviouredPropExt {
  container: HTMLSpanElement;
  img: HTMLImageElement;
  lastMoved: Date;
  healthBar?: HTMLDivElement;
  maxHealth?: number;
  overlay0?: HTMLDivElement;
  overlay1?: HTMLDivElement;
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
