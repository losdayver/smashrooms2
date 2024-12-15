import {
  ICollidable,
  IControlled,
  IDamageable,
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
  implements IDamageable, IControlled, INameTagged
{
  controlled: IControlled["controlled"] = {
    clientID: null,
    speed: 15,
    jumpSpeed: 10,
    onReceive: (code, status) => {
      if (status == "pressed") {
        if (code == "right") {
          this.$hSpeed = this.controlled.speed;
          this.scene.mutatePropBehaviourAction(this as IProp, {
            name: "drawable",
            newValue: {
              facing: "right",
            },
          });
        } else if (code == "left") {
          this.$hSpeed = -this.controlled.speed;
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
        } else if (code == "jump" && !this.$isInAir) {
          this.$vSpeed = -this.jumpSpeed;
        }
      } else {
        if (code == "right" && this.$hSpeed > 0) this.$hSpeed = 0;
        else if (code == "left" && this.$hSpeed < 0) this.$hSpeed = 0;
      }
    },
  };
  damageable = { health: 100 };
  collidable: ICollidable["collidable"] = {
    sizeX: 32,
    sizeY: 64,
    offsetX: 0,
    offsetY: 0,
    onCollide: (prop: Prop & PropBehaviours) => {},
  };
  positioned = { posX: 100, posY: 100 };
  nameTagged = { tag: "player" };
  drawable = {
    animationCode: "playerIdle",
    facing: "right",
    pivotOffsetX: 0,
    pivotOffsetY: 0,
  };

  private $hSpeed = 0;
  private $vSpeed = 0;
  private $isInAir = true;
  private $state: "playerIdle" | "playerWalk" | "playerJump" = "playerWalk";

  /** how being in air affect horizontal speed */
  private hSpeedAirTimeCoeff = 0.8;
  /** how high above ground the prop needs to be for the jump to register */
  private vJumpMargin = 10;
  private maxVSpeed = 20;
  private vAcc = 1;
  private jumpSpeed = 20;

  doLayoutPhysics = () => {
    this.$vSpeed = Math.min(this.$vSpeed + this.vAcc, this.maxVSpeed);
    const frameHSpeed = this.$isInAir
      ? this.$hSpeed * this.hSpeedAirTimeCoeff
      : this.$hSpeed;

    let newPosX = this.positioned.posX + frameHSpeed;
    let newPosY = this.positioned.posY + this.$vSpeed;

    this.$isInAir = true;

    const grid = this.scene.getSceneMeta().gridSize;

    if (frameHSpeed) {
      const isCollidingH = this.scene.checkLayoutCollision({
        positioned: {
          posY: this.positioned.posY,
          posX: this.positioned.posX + frameHSpeed,
        },
        collidable: this.collidable,
      });

      if (isCollidingH) {
        if (frameHSpeed > 0) newPosX = Math.floor(newPosX / grid) * grid;
        else if (frameHSpeed < 0)
          newPosX = Math.floor(newPosX / grid + 1) * grid;
      }
    }

    if (this.$vSpeed) {
      const isCollidingV = this.scene.checkLayoutCollision({
        positioned: {
          posY: this.positioned.posY + this.$vSpeed,
          posX: newPosX,
        },
        collidable: this.collidable,
      });

      if (isCollidingV) {
        if (this.$vSpeed > 0) newPosY = Math.floor(newPosY / grid) * grid;
        else if (this.$vSpeed < 0)
          newPosY = Math.floor(newPosY / grid + 1) * grid;
        this.$vSpeed = 0;
      }
    }

    if (
      this.scene.checkLayoutCollision({
        positioned: {
          posY: newPosY + this.vJumpMargin,
          posX: newPosX,
        },
        collidable: this.collidable,
      })
    )
      this.$isInAir = false;

    if (
      newPosX != this.positioned.posX ||
      newPosY != Math.floor(this.positioned.posY)
    )
      this.scene.mutatePropBehaviourAction(this as IProp, {
        name: "positioned",
        newValue: {
          posX: newPosX,
          posY: newPosY,
        },
      });
  };

  doSpriteChange = () => {
    let newState = this.$state;

    if (this.$isInAir) newState = "playerJump";
    else if (this.$hSpeed != 0) newState = "playerWalk";
    else newState = "playerIdle";

    if (newState != this.$state) {
      this.$state = newState;
      this.scene.mutatePropBehaviourAction(this as IProp, {
        name: "drawable",
        newValue: {
          animationCode: newState,
        },
      });
    }
  };

  onTick = () => {
    this.doSpriteChange();
    this.doLayoutPhysics();
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

export class Crate extends Prop implements IDamageable, IDrawable {
  damageable = { health: 10 };
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
