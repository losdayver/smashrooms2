import { Prop } from "../scene/prop";
import {
  ICollidable,
  IControlled,
  IDamageable,
  INameTagged,
  IProp,
  PropBehaviours,
} from "../scene/propTypes";
import { IScene } from "../scene/sceneTypes";
import { ItemProp } from "./items";
import { ItemSpawner } from "./spawners";
import { WeaponPocket } from "./weapons";

export class Player
  extends Prop
  implements IDamageable, IControlled, INameTagged
{
  controlled: IControlled["controlled"] = {
    clientID: null,
    speed: 12,
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
          this.firing = true;
        } else if (code == "jump" && !this.$isInAir) {
          this.$vSpeed = -this.jumpSpeed;
        } else if (code == "duck") {
          if (!this.$isInAir) {
            this.$passSemi = true;
          }
        } else if (code == "swap") {
          this.weaponPocket.changeWeapon();
        }
      } else {
        if (code == "right" && this.$hSpeed > 0) this.$hSpeed = 0;
        else if (code == "left" && this.$hSpeed < 0) this.$hSpeed = 0;
        else if (code == "fire") this.firing = false;
      }
    },
  };
  damageable = { health: 80, maxHealth: 80 };
  collidable: ICollidable["collidable"] = {
    sizeX: 32,
    sizeY: 64,
    offsetX: -16,
    offsetY: 0,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (prop.damaging && prop.collidable.colGroup != this.ID) {
        if (prop.moving) this.$punchH = 2 * Math.sign(prop.moving.speedH);
        this.scene.mutatePropBehaviourAction(this, {
          name: "damageable",
          newValue: {
            health: (this.damageable.health -= prop.damaging.damage),
          },
        });
        this.scene.animatePropAction(this.ID, "hit");
      } else if (prop instanceof ItemProp && !prop.isPickedUp) {
        if (prop.hasMaster) {
          (prop.hasMaster.master as ItemSpawner).pickedOnTick =
            this.scene.tickNum;
          (prop.hasMaster.master as ItemSpawner).isEmpty = true;
        }
        prop.isPickedUp = true; // todo fix double
        prop.modifyPlayer(this);
        this.scene.destroyPropAction(prop.ID);
      }
    },
  };
  positioned;
  nameTagged = { tag: "player" };
  drawable = {
    sprite: "playerIdle",
    facing: "right",
    offsetX: 16,
    offsetY: 0,
  };

  weaponPocket = new WeaponPocket(this, "fist");

  private firing = false;
  private $hSpeed = 0;
  private $vSpeed = 0;
  private $lastVSpeed = 0;
  private $isInAir = true;
  private $state: "playerIdle" | "playerWalk" | "playerJump" = "playerWalk";
  private $passSemi = false;
  private $punchH = 0;

  /** how being in air affect horizontal speed */
  private hSpeedAirTimeCoeff = 0.8;
  /** how high above ground the prop needs to be for the jump to register */
  private vJumpMargin = 10;
  private maxVSpeed = 20;
  private vAcc = 1.5;
  private jumpSpeed = 22;

  private isAlreadyDead = false;

  doLayoutPhysics = () => {
    this.$lastVSpeed = this.$vSpeed;

    this.$vSpeed = Math.min(this.$vSpeed + this.vAcc, this.maxVSpeed);

    const frameHSpeed =
      (this.$isInAir ? this.$hSpeed * this.hSpeedAirTimeCoeff : this.$hSpeed) +
      this.$punchH;
    this.$punchH = 0;

    let newPosX = this.positioned.posX + frameHSpeed;
    let newPosY = this.positioned.posY + this.$vSpeed;

    this.$isInAir = true;

    const grid = this.scene.getSceneMeta().gridSize;

    if (frameHSpeed) {
      const isCollidingH = this.scene.checkLayoutCollision(
        {
          positioned: {
            posY: this.positioned.posY,
            posX: this.positioned.posX + frameHSpeed,
          },
          collidable: this.collidable,
        },
        true
      );

      if (isCollidingH) {
        if (frameHSpeed > 0)
          newPosX = Math.floor(newPosX / grid) * grid - this.collidable.offsetX;
        else if (frameHSpeed < 0)
          newPosX =
            Math.floor(newPosX / grid + 1) * grid + this.collidable.offsetX;
      }
    }

    const currentColliding = this.scene.checkLayoutCollision({
      positioned: {
        posY: this.positioned.posY,
        posX: newPosX,
      },
      collidable: this.collidable,
    });

    {
      const isCollidingV = this.scene.checkLayoutCollision(
        {
          positioned: {
            posY: this.positioned.posY + this.$vSpeed,
            posX: newPosX,
          },
          collidable: this.collidable,
        },
        this.$passSemi || this.$lastVSpeed < 0 || currentColliding
      );

      if (isCollidingV) {
        if (this.$vSpeed > 0)
          newPosY = Math.floor(newPosY / grid) * grid - this.collidable.offsetY;
        else if (this.$vSpeed < 0)
          newPosY =
            Math.floor(newPosY / grid + 1) * grid + this.collidable.offsetY;
        this.$vSpeed = 0;
      } else this.$isInAir = true;
    }

    if (
      !currentColliding &&
      this.scene.checkLayoutCollision({
        positioned: {
          posY: newPosY + this.vJumpMargin,
          posX: newPosX,
        },
        collidable: this.collidable,
      })
    ) {
      this.$isInAir = false;
      this.$passSemi = false;
    }

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
          sprite: newState,
        },
      });
    }
  };

  onTick: Prop["onTick"] = (tick) => {
    this.doSpriteChange();
    this.doLayoutPhysics();
    this.weaponPocket.fireWeapon(this.firing, tick);
    if (this.damageable.health <= 0 && !this.isAlreadyDead) {
      this.isAlreadyDead = true;
      this.scene.destroyPropAction(this.ID);
      this.scene.sendNotification(`${this.nameTagged.tag} died`, "dead");
    }
  };

  onCreated = () => {
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
