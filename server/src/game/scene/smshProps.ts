import {
  ICollidable,
  IControlled,
  IDamageable,
  IDamaging,
  IDrawable,
  IMoving,
  INameTagged,
  IProp,
  PropBehaviours,
} from "./propTypes";
import { IScene } from "./sceneTypes";
import { getRandomBetween, pickRandom, RecursivePartial } from "../../utils";
import { Prop } from "./prop";
import { StageExt } from "../../../../types/stage";
import {
  BazookaItem,
  ItemProp,
  ItemSpawner,
  MedikitItem,
  PistolItem,
  PlayerSpawner,
  ShotgunItem,
} from "./shmsSpawners";

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
        } else if (code == "fire" && this.currentWeapon) {
          if (
            this.scene.tickNum - this.startedFiringOnTick >=
            Player.weaponMap[this.currentWeapon].delay
          ) {
            this.startedFiringOnTick = this.scene.tickNum;
          }
          this.firing = true;
        } else if (code == "jump" && !this.$isInAir) {
          this.$vSpeed = -this.jumpSpeed;
        } else if (code == "duck") {
          if (!this.$isInAir) {
            this.$passSemi = true;
          }
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
        console.log(prop.drawable.sprite);
        if (prop.moving) this.$punchH = 2 * Math.sign(prop.moving.speedH);
        this.damageable.health -= prop.damaging.damage;
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

  private healing = 0.5;

  private isAlreadyDead = false;

  private firing = false;
  private startedFiringOnTick = 0;
  private currentWeapon: keyof typeof Player.weaponMap = "fist";
  private ammo = 0;

  static weaponMap: Record<
    string,
    {
      delay?: number;
      onFire?: (player: any) => void;
    }
  > = {
    // todo move these to item classes
    fist: {
      delay: 10,
      onFire: (player: any) => {
        player.scene.spawnPropAction("fist", {
          positioned: {
            posX: player.positioned.posX,
            posY: player.positioned.posY + 40,
          },
          drawable: {
            facing: player.drawable.facing,
          },
          collidable: {
            colGroup: player.ID,
          },
        });
      },
    },
    shotgun: {
      delay: 10,
      onFire: (player: any) => {
        for (let i = -1; i < 2; i++)
          player.scene.spawnPropAction("bullet", {
            positioned: {
              posX: player.positioned.posX,
              posY: player.positioned.posY + 40,
            },
            drawable: {
              facing: player.drawable.facing,
            },
            collidable: {
              colGroup: player.ID,
            },
            moving: {
              speedV: i * 4,
            },
          });
      },
    },
    pistol: {
      delay: 5,
      onFire: (player: any) => {
        player.scene.spawnPropAction("bullet", {
          positioned: {
            posX: player.positioned.posX,
            posY: player.positioned.posY + 40,
          },
          drawable: {
            facing: player.drawable.facing,
          },
          collidable: {
            colGroup: player.ID,
          },
          moving: {
            speedV: getRandomBetween(-3, 3),
          },
        });
      },
    },
    bazooka: {
      delay: 40,
      onFire: (player: any) => {
        player.scene.spawnPropAction("rocket", {
          positioned: {
            posX: player.positioned.posX,
            posY: player.positioned.posY + 40,
          },
          drawable: {
            facing: player.drawable.facing,
          },
          collidable: {
            colGroup: player.ID,
          },
          moving: {
            speedV: getRandomBetween(-1, 1),
          },
        });
      },
    },
  };

  changeWeapon = (weapon: keyof typeof Player.weaponMap) => {
    this.currentWeapon = weapon;
  };

  fireBullet = () => {
    if (!this.currentWeapon) return;
    Player.weaponMap[this.currentWeapon].onFire(this);
  };

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
    if (
      this.firing &&
      (tick - this.startedFiringOnTick) %
        Player.weaponMap[this.currentWeapon].delay ==
        0
    ) {
      this.fireBullet();
    }
    if (this.damageable.health <= 0 && !this.isAlreadyDead) {
      this.isAlreadyDead = true;
      this.scene.destroyPropAction(this.ID);
      this.scene.sendNotification(`${this.nameTagged.tag} died`, "dead");
    } else {
      this.damageable.health = Math.min(
        this.damageable.health + this.healing,
        this.damageable.maxHealth
      );
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

export class Bullet extends Prop implements IDrawable, IDamaging, IMoving {
  positioned;
  drawable = {
    sprite: "bullet",
    facing: "right",
    offsetX: 8,
    offsetY: 8,
    anim: "appear",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 8,
    sizeY: 8,
    offsetX: -8,
    offsetY: -8,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.scene.destroyPropAction(this.ID);
    },
  };
  damaging = { damage: 25 };
  moving = {
    speedH: 32,
    speedV: 0,
  };

  createdOn: number;

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick = (tickNum: number) => {
    if (
      tickNum - this.createdOn > 30 ||
      this.scene.getLayoutAt(this.positioned.posX, this.positioned.posY)
        .solidity == "solid"
    ) {
      this.scene.destroyPropAction(this.ID);
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class Fist extends Prop implements IDrawable, IDamaging, IMoving {
  positioned;
  drawable = {
    sprite: "fist",
    facing: "right",
    offsetX: 32,
    offsetY: 32,
    anim: "appear",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 8,
    sizeY: 8,
    offsetX: -32,
    offsetY: -32,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.scene.destroyPropAction(this.ID);
    },
  };
  damaging = { damage: 10 };
  moving = {
    speedH: 16,
    speedV: 0,
  };

  createdOn: number;

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick = (tickNum: number) => {
    if (tickNum - this.createdOn > 2) {
      this.scene.destroyPropAction(this.ID);
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class Rocket extends Prop implements IDrawable, IDamaging, IMoving {
  positioned;
  drawable = {
    sprite: "rocket",
    facing: "right",
    offsetX: 8,
    offsetY: 8,
    anim: "appear",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 8,
    sizeY: 8,
    offsetX: -8,
    offsetY: -8,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.onExplode();
    },
  };
  damaging = { damage: 40 };
  moving = {
    speedH: 25,
    speedV: 0,
  };

  createdOn: number;
  isExploded = false;

  onExplode = () => {
    if (this.isExploded) return;
    this.isExploded = true;
    this.scene.spawnPropAction("explosion", {
      positioned: {
        posX: this.positioned.posX,
        posY: this.positioned.posY,
      },
    });
    this.scene.destroyPropAction(this.ID);
  };

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick = () => {
    if (
      this.scene.getLayoutAt(this.positioned.posX, this.positioned.posY)
        .solidity == "solid"
    ) {
      this.onExplode();
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class Explosion extends Prop implements IDrawable, IDamaging {
  positioned;
  drawable = {
    sprite: "explosion",
    facing: "right",
    offsetX: 64,
    offsetY: 64,
    anim: "appear",
  };
  collidable = { sizeX: 128, sizeY: 128, offsetX: -64, offsetY: -64 };
  damaging = { damage: 60 };

  createdOnTick: number;

  onCreated = (tickNum: number) => {
    this.createdOnTick = tickNum;
  };

  onTick = (tickNum: number) => {
    if (tickNum - this.createdOnTick > 0) {
      this.damaging.damage = 0;
      if (tickNum - this.createdOnTick > 2) {
        this.scene.destroyPropAction(this.ID);
      }
    }
  };
}

export class Crate extends Prop implements IDamageable, IDrawable {
  damageable = { health: 10, maxHealth: 10 };
  collidable = { sizeX: 64, sizeY: 64, offsetX: 0, offsetY: 0 };
  positioned;
  drawable = {
    sprite: "crate",
    facing: "right",
    offsetX: 0,
    offsetY: 0,
  };

  onCreated = () => {};

  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    super(scene, behaviourPresets);
  }
}

export const smshPropMap = {
  player: Player,
  crate: Crate,
  bullet: Bullet,
  rocket: Rocket,
  fist: Fist,
  playerSpawner: PlayerSpawner,
  itemSpawner: ItemSpawner,
  shotgunItem: ShotgunItem,
  bazookaItem: BazookaItem,
  pistolItem: PistolItem,
  medikitItem: MedikitItem,
  explosion: Explosion,
} as const;

export const smshPropFactory: (scene: IScene, stage: StageExt) => void = (
  scene,
  stage
) => {
  const preload = (stage.meta.extra as IStageMetaExtra)?.preload;
  if (!preload) return;
  for (const p of preload) {
    scene.spawnPropAction(p.name, p.behaviours);
  }
};

interface IStageMetaExtra {
  preload: {
    name: keyof typeof smshPropMap;
    behaviours?: RecursivePartial<PropBehaviours>;
  }[];
}
