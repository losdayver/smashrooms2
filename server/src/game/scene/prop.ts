import { IProp, PropBehaviours } from "./propTypes";
import { randomUUID } from "crypto";
import { IScene } from "./sceneTypes";

export abstract class Prop implements IProp {
  ID: string;
  scene: IScene;
  onCreated?: IProp["onCreated"];
  onTick?: IProp["onTick"];
  constructor(scene: IScene, behaviourPresets?: PropBehaviours) {
    this.ID = randomUUID();
    this.scene = scene;
    Object.entries(behaviourPresets ?? {}).map(
      ([key, value]) => (this[key] = value)
    );
  }
}
