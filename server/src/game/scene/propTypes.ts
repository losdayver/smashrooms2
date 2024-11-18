import { ClientActionCodes } from "../sockets/messageMeta";
import { Prop } from "./props";

export interface IProp {
  ID: string;
}

export interface IPositioned {
  positioned: {
    posX: number;
    posY: number;
    callback?: (newPos: { posX: number; posY: number }) => void;
  };
}

export interface IControlled {
  controlled: {
    clientID: string;
    speed: number;
    jumpSpeed: number;
    callback?: (code: ClientActionCodes, status: "press" | "release") => void;
  };
}

export interface IDrawable extends IPositioned {
  drawable: {
    animationCode: string;
    facing: "right" | "left" | string; // todo wtf
    pivotOffsetX: number;
    pivotOffsetY: number;
    callback?: () => void;
  };
}

export interface ICollidable extends IPositioned {
  collidable: {
    sizeX: number;
    sizeY: number;
    pivotOffsetX: number;
    pivotOffsetY: number;
    callback?: () => void;
  };
}

export interface IDamagable extends ICollidable {
  damagable: {
    health: number;
    callback?: (damage: number, attacker: Prop) => void;
  };
}

export interface IDamaging extends ICollidable {
  damagable: {
    damage: number;
    callback?: (health: number, victim: Prop) => void;
  };
}

export interface INameTagged extends IDrawable {
  nameTagged: {
    tag: string;
  };
}
