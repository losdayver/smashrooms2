import { layoutSpriteRoute } from "@client/routes";
import { Palette } from "../ui/palette";
import { ILayoutTile, layoutTileImgMap } from "@client/common";

export class TilePalette extends Palette<ILayoutTile> {
  constructor(container: HTMLDivElement) {
    super(container, layoutTileImgMap, layoutSpriteRoute);
  }
}
