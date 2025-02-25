import { ClientActionStatusExt } from "../../../../types/messages";
import { Prop } from "./prop";
import {
  ICollidableExt,
  IControlledExt,
  IDamageableExt,
  IDamagingExt,
  IDrawableExt,
  INameTaggedExt,
  IPositionedExt,
  IHasMasterExt,
} from "../../../../types/sceneTypes";
import { Portal } from "../smsh/portals";

export type PropBehaviours = Partial<
  IPositionedExt &
    IControlled &
    IDrawableExt &
    ICollidable &
    IDamageable &
    IDamaging &
    INameTaggedExt &
    IMoving &
    ISpawner &
    IHasMasterExt
>;

export interface IMoving {
  moving: {
    speedH: number;
    speedV: number;
  };
}

export interface ISpawner<T extends string = string> extends IPositionedExt {
  spawner: {
    props: T[];
  };
}

export type IControlled = {
  controlled: {
    onReceive?: (code: string, status: ClientActionStatusExt) => void;
  };
} & IControlledExt;

export type ICollidable = IPositionedExt & {
  collidable: {
    onCollide?: (prop: Prop & PropBehaviours) => void;
  };
} & ICollidableExt;

export type IDamageable = ICollidable & IDamageableExt;

export type IDamaging = ICollidable & IDamagingExt;

export type IPortal = {
  portal: {
    portalID?: string;
    linkedPortal?: Portal;
  };
};
