import {
  IControlled,
  IDamagable,
  IDrawable,
  INameTagged,
  IProp,
  PropBehaviours,
} from "./propTypes";
import { randomUUID } from "crypto";
import { IScene } from "./sceneTypes";
import { ClientActionCodes, ClientActionStatus } from "../sockets/messageMeta";

export abstract class Prop implements IProp {
  ID: string;
  scene: IScene;
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
  controlled = {
    clientID: null,
    speed: 10,
    jumpSpeed: 10,
    onReceive: (code: ClientActionCodes, status: ClientActionStatus) => {
      let move = 0;
      if (code == "right") move = 5;
      if (code == "left") move = -5;
      this.scene.mutatePropBehaviourAction(this as Prop, {
        name: "positioned",
        newValue: {
          ...this.positioned,
          posX: this.positioned.posX + move,
        } as any, // todo fix types
      });
    },
  };
  damagable = { health: 100 };
  collidable = {
    sizeX: 64,
    sizeY: 128,
    pivotOffsetX: 32,
    pivotOffsetY: 64,
  };
  positioned = { posX: 100, posY: 100 };
  nameTagged = { tag: "player" };
  drawable = {
    animationCode: "playerIdle",
    facing: "right",
    pivotOffsetX: 32,
    pivotOffsetY: 64,
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

export class Crate extends Prop implements IDamagable, IDrawable {
  damagable = { health: 10 };
  collidable = { sizeX: 64, sizeY: 64, pivotOffsetX: 0, pivotOffsetY: 0 };
  positioned;
  drawable = {
    animationCode: "crate",
    facing: "right",
    pivotOffsetX: 0,
    pivotOffsetY: 0,
  };

  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    super(scene, behaviourPresets);
  }
}

export const propsMap = {
  player: Player,
  crate: Crate,
};
