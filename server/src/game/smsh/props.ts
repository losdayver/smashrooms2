import { IDamageable, PropBehaviours } from "../scene/propTypes";
import { IScene } from "../scene/sceneTypes";
import { RecursivePartial } from "../../utils";
import { Prop } from "../scene/prop";
import { StageExt } from "../../../../types/stage";
import { Player } from "./player";
import {
  Bullet,
  Explosion,
  Fist,
  Plasma,
  Rocket,
  SniperBullet,
} from "./projectiles";
import { ItemSpawner, PlayerSpawner } from "./spawners";
import {
  BazookaItem,
  BlasterItem,
  MedikitItem,
  PistolItem,
  ShotgunItem,
  SniperItem,
} from "./items";
import { IDrawableExt } from "../../../../types/sceneTypes";
import { Portal } from "./portals";

export class Crate extends Prop implements IDamageable, IDrawableExt {
  damageable = { health: 10, maxHealth: 10 };
  collidable = { sizeX: 64, sizeY: 64, offsetX: 0, offsetY: 0 };
  positioned;
  drawable = {
    sprite: "crate",
    facing: "right",
    offsetX: 0,
    offsetY: 0,
  };

  onCreated = () => {};

  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    super(scene, behaviourPresets);
  }
}

export const smshPropMap = {
  player: Player,
  crate: Crate,
  bullet: Bullet,
  rocket: Rocket,
  fist: Fist,
  playerSpawner: PlayerSpawner,
  itemSpawner: ItemSpawner,
  shotgunItem: ShotgunItem,
  bazookaItem: BazookaItem,
  pistolItem: PistolItem,
  medikitItem: MedikitItem,
  explosion: Explosion,
  plasma: Plasma,
  blasterItem: BlasterItem,
  sniperBullet: SniperBullet,
  sniperItem: SniperItem,
  portal: Portal,
} as const;

export const smshPropFactory: (scene: IScene, stage: StageExt) => void = (
  scene,
  stage
) => {
  const preload = (stage.meta.extra as IStageMetaExtra)?.preload;
  if (!preload) return;
  for (const p of preload) {
    scene.spawnPropAction(p.name, p.behaviours);
  }
};

interface IStageMetaExtra {
  preload: {
    name: keyof typeof smshPropMap;
    behaviours?: RecursivePartial<PropBehaviours>;
  }[];
}
