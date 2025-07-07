import {
  ICollidableExt,
  IControlledExt,
  IDamageableExt,
  IDamagingExt,
  IDrawableExt,
  IHasMasterExt,
  INameTaggedExt,
  IPositionedExt,
} from "@stdTypes/sceneTypes";

export type ICanvasPropBehaviours = Partial<
  IPositionedExt &
    IControlledExt &
    IDrawableExt &
    ICollidableExt &
    IDamageableExt &
    IDamagingExt &
    INameTaggedExt &
    IHasMasterExt
>;
