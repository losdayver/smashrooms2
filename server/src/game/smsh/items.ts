import { ICollidable, IDrawable, PropBehaviours } from "../scene/propTypes";
import { IScene } from "../scene/sceneTypes";
import { Prop } from "../scene/prop";
import { Player } from "./player";
import { IHasMasterExt } from "../../../../types/sceneTypes";

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
    player.weaponPocket.pickWeapon("shotgun");
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
    player.weaponPocket.pickWeapon("pistol");
  };
}

export class BazookaItem extends ItemProp {
  drawable = {
    sprite: "bazooka",
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
    player.weaponPocket.pickWeapon("bazooka");
  };
}

export class BlasterItem extends ItemProp {
  drawable = {
    sprite: "blaster",
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
    player.weaponPocket.pickWeapon("blaster");
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
    this.scene.mutatePropBehaviourAction(player, {
      name: "damageable",
      newValue: {
        health: Math.min(
          (player.damageable.health += 50),
          player.damageable.maxHealth
        ),
      },
    });
  };
}
