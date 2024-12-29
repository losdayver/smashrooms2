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
    animationCode: string;
    facing: "right" | "left" | string;
    pivotOffsetX: number;
    pivotOffsetY: number;
  };
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

export type PropBehavioursExt = Partial<
  IPositionedExt &
    IControlledExt &
    IDrawableExt &
    ICollidableExt &
    IDamageableExt &
    IDamagingExt &
    INameTaggedExt
>;

export type IBehaviouredPropExt = IPropExt & PropBehavioursExt;
