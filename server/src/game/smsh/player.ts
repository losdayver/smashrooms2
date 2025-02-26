import { IDrawableExt, INameTaggedExt } from "../../../../types/sceneTypes";
import { Prop } from "../scene/prop";
import {
  ICollidable,
  IControlled,
  IDamageable,
  PropBehaviours,
} from "../scene/propTypes";
import { IScene } from "../scene/sceneTypes";
import { ItemProp } from "./items";
import { ItemSpawner } from "./spawners";
import { WeaponPocket } from "./weapons";
import { IScoreUpdateExt } from "../../../../smshTypes/messages";
import { getRandomBetween } from "../../utils";

export class Player
  extends Prop
  implements IDamageable, IControlled, INameTaggedExt
{
  controlled: IControlled["controlled"] = {
    clientID: null,
    speed: 12,
    jumpSpeed: 10,
    onReceive: (code, status) => {
      if (status == "pressed") {
        if (code == "right") {
          this.$hSpeed = this.controlled.speed;
          this.scene.mutatePropBehaviourAction(this as Prop, {
            name: "drawable",
            newValue: {
              facing: "right",
            },
          });
        } else if (code == "left") {
          this.$hSpeed = -this.controlled.speed;
          this.scene.mutatePropBehaviourAction(this as Prop, {
            name: "drawable",
            newValue: {
              facing: "left",
            },
          });
        } else if (code == "fire") {
          this.$firing = true;
        } else if (code == "jump" && !this.$isInAir) {
          this.$vSpeed = -this.jumpSpeed;
          this.scene.produceSound("jump");
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
        else if (code == "fire") this.$firing = false;
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
        this.$lastHitBy = prop.collidable.colGroup;
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
  drawable: IDrawableExt["drawable"] = {
    sprite: "playerIdle",
    facing: "right",
    offsetX: 16,
    offsetY: 0,
    overlay0: {
      sprite: "hat1",
      y: 0,
    },
  };

  weaponPocket = new WeaponPocket(this, "fist");
  static score: Score;

  private $firing = false;
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
  private $isAlreadyDead = false;
  private $lastHitBy: Prop["ID"];

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
      this.scene.mutatePropBehaviourAction(this as Prop, {
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
      this.scene.mutatePropBehaviourAction(this as Prop, {
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
    this.weaponPocket.fireWeapon(this.$firing, tick);
    if (this.damageable.health <= 0 && !this.$isAlreadyDead) {
      this.$isAlreadyDead = true;
      Player.score.increment(this, "D");
      const killer = this.scene.getPropByID(this.$lastHitBy);
      if (killer) Player.score.increment(killer as Player, "K");
      this.scene.destroyPropAction(this.ID);
      this.scene.produceSound("death");
      this.scene.sendNotification(`${this.nameTagged.tag} died`, "dead");
    }
  };
  onCreated: Prop["onCreated"] = (_, reason) => {
    this.drawable.overlay0.sprite = `hat${Math.floor(getRandomBetween(1, 6))}`;
    if (reason == "connect") Player.score.register(this);
    this.collidable.colGroup = this.ID;
  };
  onDestroyed: Prop["onDestroyed"] = (reason) => {
    if (reason == "disconnect") Player.score.unlist(this);
  };
  constructor(
    clientID: string,
    scene: IScene,
    behaviourPresets?: PropBehaviours
  ) {
    super(scene, behaviourPresets);
    Player.score ??= new Score(this.scene);
    this.controlled.clientID = clientID;
  }
}

class Score {
  private scene: IScene;
  private scoreObj: Record<string, { K: number; D: number }> = {};

  unlist = (player: Player) => {
    this.scene.sendArbitraryMessage(
      {
        name: "score",
        tag: player.nameTagged.tag,
        unlist: true,
      } satisfies IScoreUpdateExt,
      "all"
    );
    delete this.scoreObj[player.nameTagged.tag];
  };
  register = (player: Player) => {
    this.scoreObj[player.nameTagged.tag] = { K: 0, D: 0 };
    Object.entries(this.scoreObj).forEach(([tag, obj]) => {
      this.scene.sendArbitraryMessage(
        {
          name: "score",
          tag: tag,
          K: obj.K,
          D: obj.D,
        } satisfies IScoreUpdateExt,
        player.controlled.clientID
      );
    });
    this.scene.sendArbitraryMessage(
      {
        name: "score",
        tag: player.nameTagged.tag,
        K: 0,
        D: 0,
      } satisfies IScoreUpdateExt,
      "all"
    );
  };
  increment = (player: Player, what: "K" | "D") => {
    this.scoreObj[player.nameTagged.tag][what]++;
    this.scene.sendArbitraryMessage(
      {
        name: "score",
        tag: player.nameTagged.tag,
        K: this.scoreObj[player.nameTagged.tag].K,
        D: this.scoreObj[player.nameTagged.tag].D,
      } satisfies IScoreUpdateExt,
      "all"
    );
  };

  constructor(scene: IScene) {
    this.scene = scene;
  }
}
