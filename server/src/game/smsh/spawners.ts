import { pickRandom } from "@server/utils";
import { Prop } from "@server/game/scene/prop";
import { ISpawner, PropBehaviours } from "@server/game/scene/propTypes";
import { IScene } from "@server/game/scene/sceneTypes";
import { smshPropMap } from "@server/game/smsh/props";

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
    props: [
      "shotgunItem",
      "pistolItem",
      "medikitItem",
      "bazookaItem",
      "blasterItem",
      "sniperItem",
    ],
    spawnDelay: 120,
  };
  positioned;

  destroyedOnTick = 0;
  isEmpty = true;

  // todo fix spawners
  onTick = (tickNum: number) => {
    if (
      tickNum - this.destroyedOnTick > this.spawner.spawnDelay &&
      this.isEmpty
    ) {
      this.isEmpty = false;
      this.scene.spawnPropAction(pickRandom(this.spawner.props), {
        positioned: {
          posX: this.positioned.posX,
          posY: this.positioned.posY,
        },
        hasMaster: {
          master: this,
          onDestroySlave: () => {
            this.isEmpty = true;
            this.destroyedOnTick = this.scene.tickNum;
          },
        },
      });
    }
  };

  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    super(scene, behaviourPresets);
  }
}

export type ItemSpawnerType = ISpawner<keyof typeof smshPropMap>;
