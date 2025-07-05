import { layoutTileImgMap } from "@client/easel/easelManager";
import { layoutSpriteRoute } from "@client/routes";
import { ITile } from "@stdTypes/sceneTypes";

export class TilePalette {
  constructor(container: HTMLDivElement) {
    this.palette = document.createElement("div");
    this.palette.className = this.baseClassName;
    let firstTileDiv: HTMLDivElement;
    let firstTile: ITile;
    for (const tile of Object.keys(layoutTileImgMap)) {
      const tileDiv = document.createElement("div");
      firstTileDiv ??= tileDiv;
      firstTile ??= tile as ITile;
      tileDiv.className = `${this.baseClassName}__tile`;
      tileDiv.onclick = () => this._selectTile(tileDiv, tile as ITile);
      const img = document.createElement("img") as HTMLImageElement;
      img.src = `${layoutSpriteRoute}${layoutTileImgMap[tile].imgSrc}`;
      tileDiv.appendChild(img);
      this.palette.appendChild(tileDiv);
    }
    container.appendChild(this.palette);
    this._selectTile(firstTileDiv, firstTile);
  }

  readonly baseClassName =
    "editor__workplace__left-sidebar__palette__tiles-container__palette";
  private _selectTile = (tileDiv: HTMLDivElement, tile: ITile) => {
    Array.from(this.palette.children).forEach((child) =>
      child.classList.remove(`${this.baseClassName}__tile--selected`)
    );
    this.selectedTile == tile
      ? tileDiv.classList.remove(`${this.baseClassName}__tile--selected`)
      : tileDiv.classList.add(`${this.baseClassName}__tile--selected`);
    this.selectedTile = tile as ITile;
  };
  private selectedTile: ITile;
  private palette: HTMLDivElement;

  getCurrentTile = () => this.selectedTile;
}
