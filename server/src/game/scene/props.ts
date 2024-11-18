import { IControlled, IDamagable, INameTagged, IProp } from "./propTypes";
import { randomUUID } from "crypto";

export abstract class Prop implements IProp {
  ID: string;
  constructor() {
    this.ID = randomUUID();
  }
}

export class Player
  extends Prop
  implements IDamagable, IControlled, INameTagged
{
  controlled = { clientID: null, speed: 10, jumpSpeed: 10 };
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

  constructor(clientID: string) {
    super();
    this.controlled.clientID = clientID;
  }
}

export class Crate extends Prop implements IDamagable {
  damagable = { health: 10 };
  collidable = { sizeX: 64, sizeY: 64, pivotOffsetX: 0, pivotOffsetY: 0 };
  positioned = {
    posX: 10,
    posY: 10,
  };

  constructor(clientID: string) {
    super();
  }
}

export const propsMap = {
  player: Player,
  crate: Crate,
};
