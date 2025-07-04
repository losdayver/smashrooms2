import { IDrawableExt } from "@stdTypes/sceneTypes";
import { Prop } from "@server/game/scene/prop";
import {
  ICollidable,
  IDamaging,
  IMoving,
  ITeleportProhibit,
  PropBehaviours,
} from "@server/game/scene/propTypes";
import { IScene } from "@server/game/scene/sceneTypes";
import { Portal } from "@server/game/smsh/portals";
import { Player } from "@server/game/smsh/player";

const projectileIgnore = [Portal];

export class Bullet extends Prop implements IDrawableExt, IDamaging, IMoving {
  positioned;
  drawable = {
    sprite: "bullet",
    facing: "right",
    offsetX: 8,
    offsetY: 8,
    anim: "appear",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 8,
    sizeY: 8,
    offsetX: -8,
    offsetY: -8,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (projectileIgnore.some((cls) => prop instanceof cls)) return;
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.scene.destroyPropAction(this.ID);
    },
  };
  damaging = { damage: 25 };
  moving = {
    speedH: 32,
    speedV: 0,
  };

  createdOn: number;

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick = (tickNum: number) => {
    if (
      tickNum - this.createdOn > 30 ||
      this.scene.getLayoutAt(this.positioned.posX, this.positioned.posY)
        .solidity == "solid"
    ) {
      this.scene.destroyPropAction(this.ID);
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class SniperBullet
  extends Prop
  implements IDrawableExt, IDamaging, IMoving
{
  positioned;
  drawable = {
    sprite: "sniperBullet",
    facing: "right",
    offsetX: 16,
    offsetY: 8,
    anim: "appear",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 64,
    sizeY: 4,
    offsetX: -32,
    offsetY: -8,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (projectileIgnore.some((cls) => prop instanceof cls)) return;
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.scene.destroyPropAction(this.ID);
    },
  };
  damaging = { damage: 65 };
  moving = {
    speedH: 64,
    speedV: 0,
  };

  createdOn: number;

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick = (tickNum: number) => {
    if (
      this.scene.getLayoutAt(this.positioned.posX, this.positioned.posY)
        .solidity == "solid" ||
      this.scene.getLayoutAt(
        this.positioned.posX + this.moving.speedH / 2,
        this.positioned.posY
      ).solidity == "solid"
    ) {
      this.scene.destroyPropAction(this.ID);
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
    if (tickNum - this.createdOn > 200) {
      this.scene.destroyPropAction(this.ID);
    }
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class InstagibBullet extends SniperBullet {
  damaging = { damage: 100 };
  drawable = {
    sprite: "instagibBullet",
    facing: "right",
    offsetX: 16,
    offsetY: 8,
    anim: "appear",
  };
}

export class Plasma extends Prop implements IDrawableExt, IDamaging, IMoving {
  positioned;
  drawable = {
    sprite: "plasma",
    facing: "right",
    offsetX: 8,
    offsetY: 8,
    anim: "plasma",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 8,
    sizeY: 8,
    offsetX: -8,
    offsetY: -8,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (projectileIgnore.some((cls) => prop instanceof cls)) return;
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.scene.destroyPropAction(this.ID);
    },
  };
  damaging = { damage: 18 };
  moving = {
    speedH: 32,
    speedV: 0,
  };

  createdOn: number;

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick = (tickNum: number) => {
    if (
      tickNum - this.createdOn > 15 ||
      this.scene.getLayoutAt(this.positioned.posX, this.positioned.posY)
        .solidity == "solid"
    ) {
      this.scene.destroyPropAction(this.ID);
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class Fist extends Prop implements IDrawableExt, IDamaging, IMoving {
  positioned;
  drawable = {
    sprite: "fist",
    facing: "right",
    offsetX: 32,
    offsetY: 32,
    anim: "appear",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 64,
    sizeY: 64,
    offsetX: -32,
    offsetY: -32,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (projectileIgnore.some((cls) => prop instanceof cls)) return;
      if (prop.collidable.colGroup != this.collidable.colGroup) {
        this.scene.destroyPropAction(this.ID);
        this.scene.produceSound("punch");
      }
    },
  };
  damaging = { damage: 10 };
  moving = {
    speedH: 16,
    speedV: 0,
  };

  createdOn: number;

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick = (tickNum: number) => {
    if (tickNum - this.createdOn > 2) {
      this.scene.destroyPropAction(this.ID);
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class Rocket extends Prop implements IDrawableExt, IDamaging, IMoving {
  positioned;
  drawable = {
    sprite: "rocket",
    facing: "right",
    offsetX: 16,
    offsetY: 16,
    anim: "appear",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 8,
    sizeY: 8,
    offsetX: -16,
    offsetY: -16,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (projectileIgnore.some((cls) => prop instanceof cls)) return;
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.onExplode();
    },
  };
  damaging = { damage: 65 };
  moving = {
    speedH: 20,
    speedV: 0,
  };

  createdOn: number;
  isExploded = false;

  onExplode = () => {
    if (this.isExploded) return;
    this.isExploded = true;
    this.scene.spawnPropAction("explosion", {
      positioned: {
        posX: this.positioned.posX,
        posY: this.positioned.posY,
      },
      collidable: {
        colGroup: this.collidable.colGroup,
      },
    });
    this.scene.destroyPropAction(this.ID);
  };

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick: Prop["onTick"] = (tickNum) => {
    if (
      this.scene.getLayoutAt(this.positioned.posX, this.positioned.posY)
        .solidity == "solid"
    ) {
      this.onExplode();
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
    if (tickNum - this.createdOn > 200) {
      this.scene.destroyPropAction(this.ID);
    }
  };

  constructor(scene: IScene) {
    super(scene);
  }
}

export class Explosion
  extends Prop
  implements IDrawableExt, IDamaging, ITeleportProhibit
{
  prohibitTeleport = { prohibit: true };
  positioned;
  drawable = {
    sprite: "explosion",
    facing: "right",
    offsetX: 64,
    offsetY: 64,
    anim: "appear",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 128,
    sizeY: 128,
    offsetX: -64,
    offsetY: -64,
    colGroupIgnoreList: [Player],
  };
  damaging = { damage: 100 };

  createdOnTick: number;

  onCreated = (tickNum: number) => {
    this.createdOnTick = tickNum;
  };

  onTick = (tickNum: number) => {
    if (tickNum - this.createdOnTick > 0) {
      this.damaging.damage = 0;
      this.scene.destroyPropAction(this.ID);
    }
  };
}

export class Bomb extends Prop implements IDrawableExt, IDamaging, IMoving {
  positioned;
  drawable = {
    sprite: "bomb",
    facing: "right",
    offsetX: 16,
    offsetY: 16,
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 8,
    sizeY: 8,
    offsetX: -16,
    offsetY: -16,
    onCollide: (prop: Prop & PropBehaviours) => {
      if (projectileIgnore.some((cls) => prop instanceof cls)) return;
      if (prop.collidable.colGroup != this.collidable.colGroup)
        this.onExplode();
    },
  };
  damaging = { damage: 15 };
  moving = {
    speedH: 0,
    speedV: 25,
  };

  createdOn: number;
  isExploded = false;

  onExplode = () => {
    if (this.isExploded) return;
    this.isExploded = true;
    this.scene.spawnPropAction("explosion", {
      positioned: {
        posX: this.positioned.posX,
        posY: this.positioned.posY,
      },
    });
    this.scene.destroyPropAction(this.ID);
  };

  onCreated = (tickNum: number) => {
    this.createdOn = tickNum;
    if (this.drawable.facing == "left") this.moving.speedH *= -1;
  };

  onTick: Prop["onTick"] = (tickNum) => {
    if (
      this.scene.getLayoutAt(this.positioned.posX, this.positioned.posY)
        .solidity == "solid"
    ) {
      this.onExplode();
      return;
    }
    this.scene.mutatePropBehaviourAction(this as Prop, {
      name: "positioned",
      newValue: {
        ...this.positioned,
        posX: (this.positioned.posX += this.moving.speedH),
        posY: (this.positioned.posY += this.moving.speedV),
      },
    });
    if (tickNum - this.createdOn > 200) {
      this.scene.destroyPropAction(this.ID);
    }
  };

  constructor(scene: IScene) {
    super(scene);
  }
}
