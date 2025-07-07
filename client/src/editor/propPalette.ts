import { propSpriteRoute } from "@client/routes";
import { Palette } from "./palette";
import { layoutPropImgMap } from "@client/common";

export class PropPalette extends Palette<any> {
  constructor(container: HTMLDivElement) {
    super(
      container,
      layoutPropImgMap,
      propSpriteRoute,
      "editor__workplace__left-sidebar__palette__props-container__palette"
    );
  }
}
