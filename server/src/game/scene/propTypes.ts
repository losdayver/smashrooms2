import {
  ClientActionCodesExt,
  ClientActionStatusExt,
} from "../../../../types/messages";
import { Prop } from "./props";
import { IScene } from "./sceneTypes";
import {
  ICollidableExt,
  IControlledExt,
  IDamagableExt,
  IDamagingExt,
  IDrawableExt,
  IPropExt,
  INameTaggedExt,
  IPositionedExt,
} from "../../../../types/sceneTypes";

export type PropBehaviours = Partial<
  IPositioned &
    IControlled &
    IDrawable &
    ICollidable &
    IDamagable &
    IDamaging &
    INameTagged
>;

export interface IProp extends IPropExt {
  scene: IScene;
  onTick?: (tickNum: number) => void;
  onCreated?: (tickNum: number) => void;
}

export type IPositioned = {
  positioned: {
    callback?: (newPos: { posX: number; posY: number }) => void;
  };
} & IPositionedExt;

export type IControlled = {
  controlled: {
    onReceive?: (
      code: ClientActionCodesExt,
      status: ClientActionStatusExt
    ) => void;
  };
} & IControlledExt;

export type IDrawable = IPositioned & {
  drawable: {
    callback?: () => void;
  };
} & IDrawableExt;

export type ICollidable = IPositioned & {
  collidable: {
    onCollide?: (prop: Prop & PropBehaviours) => void;
  };
} & ICollidableExt;

export type IDamagable = ICollidable & {
  damagable: {
    health: number;
    callback?: (damage: number, attacker: Prop) => void;
  };
} & IDamagableExt;

export type IDamaging = ICollidable & {
  damagable: {
    damage: number;
    callback?: (health: number, victim: Prop) => void;
  };
} & IDamagingExt;

export type INameTagged = IDrawable & {
  nameTagged: {
    tag: string;
  };
} & INameTaggedExt;
