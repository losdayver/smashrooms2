import {
  ICollidable,
  IControlled,
  IDamagable,
  IDrawable,
  INameTagged,
  IProp,
  PropBehaviours,
} from "./propTypes";
import { randomUUID } from "crypto";
import { IScene } from "./sceneTypes";

export abstract class Prop implements IProp {
  ID: string;
  scene: IScene;
  onCreated?: IProp["onCreated"];
  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    this.ID = randomUUID();
    this.scene = scene;
    Object.entries(behaviourPresets ?? {}).map(
      ([key, value]) => (this[key] = value)
    );
  }
}

export class Player
  extends Prop
  implements IDamagable, IControlled, INameTagged
{
  controlled: IControlled["controlled"] = {
    clientID: null,
    speed: 10,
    jumpSpeed: 10,
    onReceive: (code, status) => {
      if (status == "pressed") {
        if (code == "right") {
          this.hSpeed = this.controlled.speed;
          this.scene.mutatePropBehaviourAction(this as IProp, {
            name: "drawable",
            newValue: {
              facing: "right",
            },
          });
        } else if (code == "left") {
          this.hSpeed = -this.controlled.speed;
          this.scene.mutatePropBehaviourAction(this as IProp, {
            name: "drawable",
            newValue: {
              facing: "left",
            },
          });
        } else if (code == "fire") {
          this.scene.spawnPropAction("bullet", {
            positioned: {
              posX: this.positioned.posX,
              posY: this.positioned.posY - this.drawable.pivotOffsetY / 2,
            },
            drawable: {
              facing: this.drawable.facing,
            },
            collidable: {
              colGroup: this.ID,
            },
          });
        } else if (code == "jump" && !this.isFalling) {
          this.vSpeed = -this.jumpSpeed;
        }
      } else {
        if (code == "right" && this.hSpeed > 0) this.hSpeed = 0;
        else if (code == "left" && this.hSpeed < 0) this.hSpeed = 0;
      }
    },
  };
  damagable = { health: 100 };
  collidable: ICollidable["collidable"] = {
    sizeX: 64,
    sizeY: 64,
    offsetX: -32,
    offsetY: -64,
    onCollide: (prop: Prop & PropBehaviours) => {},
  };
  positioned = { posX: 100, posY: 100 };
  nameTagged = { tag: "player" };
  drawable = {
    animationCode: "playerIdle",
    facing: "right",
    pivotOffsetX: 32,
    pivotOffsetY: 64,
  };

  private hSpeed = 0;
  private vSpeed = 0;
  private vAcc = 0.7;
  private jumpSpeed = 14;
  private isFalling = true;

  onTick = () => {
    // todo this is a temporary implementation
    if (this.isFalling) {
      this.vSpeed += this.vAcc;
      if (this.vSpeed > 20) this.vSpeed = 20;
    }

    let leftX = this.positioned.posX + this.collidable.offsetX;
    let rightX =
      this.positioned.posX + this.collidable.offsetX + this.collidable.sizeX;
    let middleX = leftX + (rightX - leftX) / 2;

    let downY =
      this.positioned.posY + this.collidable.offsetY + this.collidable.sizeY;
    let topY = this.positioned.posY + this.collidable.offsetY;
    let middleY = topY + (downY - topY) / 2;

    let newX: number;
    let newY: number;

    const grid = this.scene.getSceneMeta().gridSize;

    // when moving right
    if (
      (this.hSpeed > 0 &&
        this.scene.getLayoutAt(rightX + this.hSpeed, topY + 1).solid) ||
      this.scene.getLayoutAt(rightX + this.hSpeed, middleY).solid ||
      this.scene.getLayoutAt(rightX + this.hSpeed, downY).solid
    ) {
      newX = Math.floor(this.positioned.posX / grid + 1) * grid - 1;
      leftX = newX + this.collidable.offsetX;
      rightX = newX + this.collidable.offsetX + this.collidable.sizeX;
      middleX = leftX + (rightX - leftX) / 2;
    } else if (
      (this.hSpeed < 0 &&
        this.scene.getLayoutAt(leftX + this.hSpeed, topY + 1).solid) ||
      this.scene.getLayoutAt(leftX + this.hSpeed, middleY).solid ||
      this.scene.getLayoutAt(leftX + this.hSpeed, downY).solid
    ) {
      newX = Math.floor(this.positioned.posX / grid) * grid + 1;
      leftX = newX + this.collidable.offsetX;
      rightX = newX + this.collidable.offsetX + this.collidable.sizeX;
      middleX = leftX + (rightX - leftX) / 2;
    }

    // when falling
    if (
      (this.vSpeed > 0 &&
        this.scene.getLayoutAt(leftX, downY + this.vSpeed + 1).solid) ||
      this.scene.getLayoutAt(middleX, downY + this.vSpeed + 1).solid ||
      this.scene.getLayoutAt(rightX - 1, downY + this.vSpeed + 1).solid
    ) {
      this.vSpeed = 0;
      newY = Math.floor(this.positioned.posY / grid + 1) * grid - 1;
      this.isFalling = false;
    }
    // when jumping
    else if (
      (this.vSpeed < 0 &&
        this.scene.getLayoutAt(leftX, topY + this.vSpeed).solid) ||
      this.scene.getLayoutAt(middleX, topY + this.vSpeed).solid ||
      this.scene.getLayoutAt(rightX - 1, topY + this.vSpeed).solid
    ) {
      this.vSpeed = this.vAcc;
      newY = Math.floor(this.positioned.posY / grid + 1) * grid - 1;
      this.isFalling = true;
    } else {
      this.isFalling = true;
    }

    if (
      this.hSpeed ||
      this.vSpeed ||
      (newX && newX != this.positioned.posX) ||
      (newY && newY != this.positioned.posY)
    ) {
      this.scene.mutatePropBehaviourAction(this as Prop, {
        name: "positioned",
        newValue: {
          posX: newX ?? (this.positioned.posX += this.hSpeed),
          posY: newY ?? (this.positioned.posY += this.vSpeed),
        },
      });
    }
  };

  onCreated = (tickNum: number) => {
    this.collidable.colGroup = this.ID;
  };

  constructor(
    clientID: string,
    scene: IScene,
    behaviourPresets?: PropBehaviours
  ) {
    super(scene, behaviourPresets);
    this.controlled.clientID = clientID;
  }
}

export class DummyBullet extends Prop implements IDrawable {
  positioned = { posX: 100, posY: 100 };
  drawable = {
    animationCode: "bullet",
    facing: "right",
    pivotOffsetX: 16,
    pivotOffsetY: 16,
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 64,
    sizeY: 64,
    offsetX: 0,
    offsetY: 0,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.scene.destroyPropAction(this.ID);
    },
  };

  private movingTickSpeed = 50;

  createdOn: number;

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.movingTickSpeed *= -1;
  };

  onTick = (tickNum: number) => {
    if (
      tickNum - this.createdOn > 20 ||
      this.scene.getLayoutAt(this.positioned.posX, this.positioned.posY)
        .solid ||
      this.scene.getLayoutAt(
        this.positioned.posX + this.movingTickSpeed / 2,
        this.positioned.posY
      ).solid ||
      this.scene.getLayoutAt(
        this.positioned.posX + this.movingTickSpeed,
        this.positioned.posY
      ).solid
    ) {
      this.scene.destroyPropAction(this.ID);
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.movingTickSpeed),
      },
    });
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class Crate extends Prop implements IDamagable, IDrawable {
  damagable = { health: 10 };
  collidable = { sizeX: 64, sizeY: 64, offsetX: 0, offsetY: 0 };
  positioned;
  drawable = {
    animationCode: "crate",
    facing: "right",
    pivotOffsetX: 0,
    pivotOffsetY: 0,
  };

  onCreated = () => {};

  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    super(scene, behaviourPresets);
  }
}

export const propsMap = {
  player: Player,
  crate: Crate,
  bullet: DummyBullet,
};
