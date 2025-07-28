/**
 * @file contains types for game props that are shared between client and server
 * @author Zhmelev Oleg
 */
export type PropIDExt = string;

export interface IPropExt {
  ID: PropIDExt;
}

export type ISceneUpdatesMessageData = {
  update?: UpdateBehavioursExt;
  load?: IBehaviouredPropExt[];
  delete?: PropIDExt[];
  anim?: IAnimationExt[];
};

export interface IAnimationExt {
  ID: PropIDExt;
  name: string;
}

export type UpdateBehavioursExt = Record<PropIDExt, PropBehavioursExt>;

export interface IPositionedExt {
  positioned: {
    posX: number;
    posY: number;
  };
}

export interface IControlledExt {
  controlled: {
    clientID: string;
    speed: number;
    jumpSpeed: number;
  };
}

export interface IDrawableExt extends IPositionedExt {
  drawable: {
    sprite: string;
    facing: "right" | "left" | string;
    offsetX: number;
    offsetY: number;
    anim?: string;
    /** passing null explicitly will result in overlay removal */
    overlay0?: ISpriteOverlay | null;
    overlay1?: ISpriteOverlay | null;
  };
}
export interface ISpriteOverlay {
  sprite: string;
  y: number;
}

export interface ICollidableExt extends IPositionedExt {
  collidable: {
    sizeX: number;
    sizeY: number;
    offsetX: number;
    offsetY: number;
    colGroup?: string;
  };
}

export interface IDamageableExt extends ICollidableExt {
  damageable: {
    health: number;
    maxHealth: number;
  };
}

export interface IDamagingExt extends ICollidableExt {
  damaging: {
    damage: number;
  };
}

export interface INameTaggedExt extends IDrawableExt {
  nameTagged: {
    tag: string;
  };
}

export interface IHasMasterExt {
  hasMaster: {
    master: IPropExt;
  };
}

export interface IPortalExt {
  portal: {
    portalID?: string;
  };
}

export type PropBehavioursExt = Partial<
  IPositionedExt &
    IControlledExt &
    IDrawableExt &
    ICollidableExt &
    IDamageableExt &
    IDamagingExt &
    INameTaggedExt &
    IPortalExt
>;

export type IBehaviouredPropExt = IPropExt & PropBehavioursExt;

export type ITileSymbols =
  | " " /** ghost */
  | "#" /** bricks */
  | "=" /** metalBeam */
  | "G" /** deepGround */
  | "g" /** grass */
  | "l" /** leaves */
  | "s" /** stone */
  | "m" /** metal */
  | "b"; /** box */
