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
  ID: string;
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

export const propsMap = {
  player: Player,
};
