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
          this.movingTickSpeed = this.controlled.speed;
          this.scene.mutatePropBehaviourAction(this as IProp, {
            name: "drawable",
            newValue: {
              facing: "right",
            },
          });
        } else if (code == "left") {
          this.movingTickSpeed = -this.controlled.speed;
          this.scene.mutatePropBehaviourAction(this as IProp, {
            name: "drawable",
            newValue: {
              facing: "left",
            },
          });
        } else if (code == "jump")
          this.movingTickSpeedV = this.controlled.speed;
        else if (code == "duck") this.movingTickSpeedV = -this.controlled.speed;
        else if (code == "fire") {
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
        }
      } else {
        if (code == "right" && this.movingTickSpeed > 0)
          this.movingTickSpeed = 0;
        else if (code == "left" && this.movingTickSpeed < 0)
          this.movingTickSpeed = 0;
        if (code == "jump" && this.movingTickSpeedV > 0)
          this.movingTickSpeedV = 0;
        else if (code == "duck" && this.movingTickSpeedV < 0)
          this.movingTickSpeedV = 0;
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
  positioned = { posX: 0, posY: 0 };
  nameTagged = { tag: "player" };
  drawable = {
    animationCode: "playerIdle",
    facing: "right",
    pivotOffsetX: 32,
    pivotOffsetY: 64,
  };

  private movingTickSpeed = 0;
  private movingTickSpeedV = 0; // remove (this one is temporary)

  onTick = () => {
    if (this.movingTickSpeed || this.movingTickSpeedV) {
      this.scene.mutatePropBehaviourAction(this as Prop, {
        name: "positioned",
        newValue: {
          ...this.positioned,
          posX: (this.positioned.posX += this.movingTickSpeed),
          posY: (this.positioned.posY -= this.movingTickSpeedV),
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
    if (tickNum - this.createdOn > 20) {
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
