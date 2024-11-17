export interface IProp {
  ID: string;
}

export interface IPositioned {
  positioned: {
    posX: number;
    posY: number;
  };
}

export interface IControlled {
  controlled: {
    clientID: string;
    speed: number;
    jumpSpeed: number;
  };
}

export interface IDrawable extends IPositioned {
  drawable: {
    animationCode: string;
    facing: "right" | "left" | string; // todo wtf
    pivotOffsetX: number;
    pivotOffsetY: number;
  };
}

export interface ICollidable extends IPositioned {
  collidable: {
    sizeX: number;
    sizeY: number;
    pivotOffsetX: number;
    pivotOffsetY: number;
  };
}

export interface IDamagable extends ICollidable {
  damagable: {
    health: number;
  };
}

export interface IDamaging extends ICollidable {
  damagable: {
    damage: number;
  };
}

export interface INameTagged extends IDrawable {
  nameTagged: {
    tag: string;
  };
}
