import { layoutSpriteRoute } from "@client/routes";
import { Palette } from "./palette";
import { ILayoutTile, layoutTileImgMap } from "@client/common";

export class TilePalette extends Palette<ILayoutTile> {
  constructor(container: HTMLDivElement) {
    super(
      container,
      layoutTileImgMap,
      layoutSpriteRoute,
      "editor__workplace__left-sidebar__palette__tiles-container__palette"
    );
  }
}
