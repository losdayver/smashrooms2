import { pickRandom } from "../../utils";
import { Prop } from "../scene/prop";
import { ISpawner, PropBehaviours } from "../scene/propTypes";
import { IScene } from "../scene/sceneTypes";
import { smshPropMap } from "./props";

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
    props: ["shotgunItem", "pistolItem", "medikitItem", "bazookaItem"],
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

export type ItemSpawnerType = ISpawner<keyof typeof smshPropMap>;
