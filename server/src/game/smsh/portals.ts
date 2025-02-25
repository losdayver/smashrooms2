import { ISpriteOverlay } from "../../../../types/sceneTypes";
import { Prop } from "../scene/prop";
import { ICollidable, IDrawable, PropBehaviours } from "../scene/propTypes";

export class Portal extends Prop implements ICollidable, IDrawable {
  drawable: IDrawable["drawable"] = {
    sprite: "portal",
    facing: "right",
    offsetX: 16,
    offsetY: 32,
  };
  positioned;
  collidable: ICollidable["collidable"] = {
    sizeX: 32,
    sizeY: 64,
    offsetX: 16,
    offsetY: 32,
    onCollide: () => {},
  };

  linkedPortal: Portal;

  onCreated: Prop["onCreated"] = (tickNum: number) => {};
}
