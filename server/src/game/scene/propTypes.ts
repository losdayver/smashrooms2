import {
  ClientActionCodesExt,
  ClientActionStatusExt,
} from "../../../../types/messages";
import { Prop } from "./prop";
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
    INameTagged &
    IMoving
>;

export interface IProp extends IPropExt {
  scene: IScene;
  onTick?: (tickNum: number) => void;
  onCreated?: (tickNum: number) => void;
}

export interface IMoving {
  moving: {
    speedH: number;
    speedV: number;
  };
}

export type IPositioned = IPositionedExt;

export type IControlled = {
  controlled: {
    onReceive?: (
      code: ClientActionCodesExt,
      status: ClientActionStatusExt
    ) => void;
  };
} & IControlledExt;

export type IDrawable = IDrawableExt;

export type ICollidable = IPositioned & {
  collidable: {
    onCollide?: (prop: Prop & PropBehaviours) => void;
  };
} & ICollidableExt;

export type IDamageable = ICollidable & IDamageableExt;

export type IDamaging = ICollidable & IDamagingExt;

export type INameTagged = INameTaggedExt;
