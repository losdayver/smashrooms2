import { IDrawableExt, IPositionedExt } from "@stdTypes/sceneTypes";
import { Prop } from "@server/game/scene/prop";
import { ICollidable, IPortal } from "@server/game/scene/propTypes";

export class Portal extends Prop implements ICollidable, IDrawableExt, IPortal {
  portal;
  drawable: IDrawableExt["drawable"] = {
    sprite: "portal",
    facing: "right",
    offsetX: 16,
    offsetY: 0,
  };
  positioned;
  collidable: ICollidable["collidable"] = {
    sizeX: 32,
    sizeY: 64,
    offsetX: -16,
    offsetY: 0,
    onCollide: (prop) => {
      if (prop.prohibitTeleport?.prohibit) return;
      if (
        this.portal.linkedPortal.interactedWithLastTick.has(prop.ID) ||
        this.portal.linkedPortal.interactedWith.has(prop.ID)
      ) {
        this.portal.linkedPortal.interactedWith.add(prop.ID);
        return;
      }
      this.interactedWith.add(prop.ID);
      this.scene.animatePropAction(this.ID, "portal");
      this.scene.animatePropAction(this.portal.linkedPortal.ID, "portal");
      this.scene.animatePropAction(prop.ID, "teleported");
      this.scene.produceSound("teleport");
      this.scene.mutatePropBehaviourAction(prop, {
        name: "positioned",
        newValue: {
          posX: this.portal.linkedPortal.positioned.posX,
          posY:
            this.portal.linkedPortal.positioned.posY +
            (prop.positioned.posY - this.positioned.posY),
        } satisfies IPositionedExt["positioned"],
      });
    },
  };

  interactedWithLastTick = new Set<string>();
  interactedWith = new Set<string>();

  onTick: Prop["onTick"] = () => {
    this.interactedWithLastTick = new Set(this.interactedWith);
    this.interactedWith = new Set();
    if (this.portal.linkedPortal) return;
    const linkedPortal = this.scene.queryProp(
      (prop) =>
        prop instanceof Portal &&
        this.portal.portalID == prop.portal.portalID &&
        prop.ID != this.ID
    );
    this.portal.linkedPortal = linkedPortal;
  };
}
