import { ClientActionStatusExt } from "@stdTypes/messages";
import { Prop } from "@server/game/scene/prop";
import {
  ICollidableExt,
  IControlledExt,
  IDamageableExt,
  IDamagingExt,
  IDrawableExt,
  INameTaggedExt,
  IPositionedExt,
  IHasMasterExt,
} from "@stdTypes/sceneTypes";
import { Portal } from "@server/game/smsh/portals";

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
    IHasMasterExt &
    ITeleportProhibit
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
    /** if not empty, collisions ONLY with the props in the following list will be registered */
    whitelist?: any[];
    /** colGroup will ignore props in the following list */
    colGroupIgnoreList?: any[];
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

export type ITeleportProhibit = {
  prohibitTeleport: {
    prohibit: boolean;
  };
};
