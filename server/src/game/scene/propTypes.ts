import { ClientActionCodes, ClientActionStatus } from "../sockets/messageMeta";
import { Prop } from "./props";
import { IScene } from "./sceneTypes";

export type PropBehaviours = Partial<
  IPositioned &
    IControlled &
    IDrawable &
    ICollidable &
    IDamagable &
    IDamaging &
    INameTagged
>;

export interface IProp {
  scene: IScene;
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
    onReceive?: (code: ClientActionCodes, status: ClientActionStatus) => void;
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
