import { IAnimationExt, IHasMasterExt } from "../../../../types/sceneTypes";
import { pickRandom } from "../../utils";
import { Prop } from "./prop";
import { ICollidable, IDrawable, ISpawner, PropBehaviours } from "./propTypes";
import { IScene } from "./sceneTypes";
import { Player, smshPropMap } from "./smshProps";

export class PlayerSpawner extends Prop implements ItemSpawnerType {
  spawner: ItemSpawnerType["spawner"] = {
    props: ["player"],
  };
  positioned;

  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    super(scene, behaviourPresets);
  }
}

export class ItemSpawner extends Prop implements ItemSpawnerType {
  spawner: ItemSpawnerType["spawner"] = {
    props: ["shotgunItem", "pistolItem", "medikit"],
  };
  positioned;

  spawnDelay = 60;
  pickedOnTick = 0;
  isEmpty = true;

  onTick = (tickNum: number) => {
    if (tickNum - this.pickedOnTick > this.spawnDelay && this.isEmpty) {
      this.isEmpty = false;
      this.scene.spawnPropAction(pickRandom(this.spawner.props), {
        positioned: {
          posX: this.positioned.posX,
          posY: this.positioned.posY,
        },
        hasMaster: {
          master: this,
        },
      });
    }
  };

  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    super(scene, behaviourPresets);
  }
}

export abstract class ItemProp
  extends Prop
  implements IDrawable, ICollidable, IHasMasterExt
{
  abstract drawable: IDrawable["drawable"];
  abstract collidable: ICollidable["collidable"];
  positioned;
  hasMaster: IHasMasterExt["hasMaster"];
  abstract modifyPlayer: (player: Player) => void;
  isPickedUp = false;

  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    super(scene, behaviourPresets);
  }
}

export class ShotgunItem extends ItemProp {
  drawable = {
    sprite: "shotgun",
    facing: "right",
    offsetX: 16,
    offsetY: 16,
    anim: "itemSpin",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 32,
    sizeY: 32,
    offsetX: -16,
    offsetY: -16,
  };
  modifyPlayer = (player: Player) => {
    player.changeWeapon("shotgun");
  };
}
export class PistolItem extends ItemProp {
  drawable = {
    sprite: "pistol",
    facing: "right",
    offsetX: 16,
    offsetY: 16,
    anim: "itemSpin",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 32,
    sizeY: 32,
    offsetX: -16,
    offsetY: -16,
  };
  modifyPlayer = (player: Player) => {
    player.changeWeapon("pistol");
  };
}

export class MedikitItem extends ItemProp {
  drawable = {
    sprite: "medikit",
    facing: "right",
    offsetX: 16,
    offsetY: 16,
    anim: "itemSpin",
  };
  collidable: ICollidable["collidable"] = {
    sizeX: 32,
    sizeY: 32,
    offsetX: -16,
    offsetY: -16,
  };
  modifyPlayer = (player: Player) => {
    this.scene.animatePropAction(player.ID, "heal");
    player.damageable.health = Math.min(
      player.damageable.health + 50,
      player.damageable.maxHealth
    );
  };
}

export type ItemSpawnerType = ISpawner<keyof typeof smshPropMap>;
