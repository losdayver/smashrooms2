import { PropBehaviours } from "@server/game/scene/propTypes";
import {
  IScene,
  ISpawnControlledPropEvent,
} from "@server/game/scene/sceneTypes";
import { randomUUID } from "crypto";

export abstract class Prop implements Prop {
  ID: string;
  scene: IScene;
  $isDestroyed = false;
  onCreated?: (
    tickNum: number,
    reason?: ISpawnControlledPropEvent["data"]["type"]
  ) => void;
  onDestroyed?: (reason?: "disconnect") => void;
  onTick?: (tickNum: number) => void;
  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    this.ID = randomUUID();
    this.scene = scene;
    Object.entries(behaviourPresets ?? {}).map(
      ([key, value]) => (this[key] = value)
    );
  }
}
