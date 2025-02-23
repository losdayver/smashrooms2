import { PropBehaviours } from "./propTypes";
import { randomUUID } from "crypto";
import { IScene } from "./sceneTypes";

export abstract class Prop implements Prop {
  ID: string;
  scene: IScene;
  onCreated?: (tickNum: number, reason?: "connect") => void;
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
