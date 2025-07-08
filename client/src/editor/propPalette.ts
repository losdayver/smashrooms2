import { propSpriteRoute } from "@client/routes";
import { Palette } from "../ui/palette";
import { layoutPropMap } from "@client/common";

export class PropPalette extends Palette<any> {
  constructor(container: HTMLDivElement) {
    super(container, layoutPropMap, propSpriteRoute);
  }
}
