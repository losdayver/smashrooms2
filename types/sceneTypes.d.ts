export type PropIDExt = string;

export interface IPropExt {
  ID: PropIDExt;
}

export type IExternalEvent = {
  update?: UpdateBehavioursExt;
  load?: IBehaviouredPropExt[];
  delete?: PropIDExt[];
};

export type UpdateBehavioursExt = Record<
  PropIDExt,
  Record<string, PropBehavioursExt>
>;

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
    facing: "right" | "left" | string; // todo wtf
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
  };
}

export interface IDamagableExt extends ICollidableExt {
  damagable: {
    health: number;
  };
}

export interface IDamagingExt extends ICollidableExt {
  damagable: {
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
    IDamagableExt &
    IDamagingExt &
    INameTaggedExt
>;

export type IBehaviouredPropExt = IPropExt & PropBehavioursExt;
