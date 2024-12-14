import {
  ClientActionCodesExt,
  ClientActionStatusExt,
} from "../../../../types/messages";
import { Prop } from "./props";
import { IScene } from "./sceneTypes";
import {
  ICollidableExt,
  IControlledExt,
  IDamageableExt,
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
    IDamageable &
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

export type IDamageable = ICollidable & {
  damageable: {
    health: number;
    callback?: (damage: number, attacker: Prop) => void;
  };
} & IDamageableExt;

export type IDamaging = ICollidable & {
  damageable: {
    damage: number;
    callback?: (health: number, victim: Prop) => void;
  };
} & IDamagingExt;

export type INameTagged = IDrawable & {
  nameTagged: {
    tag: string;
  };
} & INameTaggedExt;
