import { layoutTileImgMap } from "@client/easel/easelManager";
import { layoutSpriteRoute } from "@client/routes";
import { ITile } from "@stdTypes/sceneTypes";

interface IComplexTile {
  symbol: ITile;
  domRef: HTMLDivElement | null;
}

interface ILayout {
  width: number;
  height: number;
  tiles: IComplexTile[][];
}

interface IEditorCanvasConstructorParams {
  width: number;
  height: number;
}

export class EditorCanvas {
  constructor(
    container: HTMLDivElement,
    params: IEditorCanvasConstructorParams
  ) {
    this.layout = {
      height: params.height,
      width: params.width,
      tiles: Array.from({ length: params.height }, () =>
        Array(params.width).fill({
          symbol: " ",
          domRef: null,
        })
      ),
    };
    this.canvas = document.createElement("div");
    this.canvas.className = "editor__workplace__canvas";
    this.canvas.onclick = (ev) => this.onClick(ev.clientX, ev.clientY, "rmb");
    this.canvas.onauxclick = (ev) =>
      this.onClick(ev.clientX, ev.clientY, "lmb");
    container.appendChild(this.canvas);
  }

  private onClick = (
    xReal: number,
    yReal: number,
    button: "lmb" | "rmb" | "mmb"
  ) => {
    const { left, top } = this.canvas.getBoundingClientRect();
    const xRelative = xReal - left;
    const yRelative = yReal - top;
    const xLayout = Math.floor(xRelative / this.tileSize);
    const yLayout = Math.floor(yRelative / this.tileSize);
    if (!this.checkLayoutBounds(xLayout, yLayout)) return;
    if (button == "rmb" && this.getTile(xLayout, yLayout) == " ")
      this.placeTile(xLayout, yLayout, "#");
    else if (button == "lmb") this.removeTile(xLayout, yLayout);
  };

  private tileSize = 32;
  private canvas: HTMLDivElement;
  private layout: ILayout;

  private constructTileDiv = (x: number, y: number, tile: ITile) => {
    const tileDiv = document.createElement("div");
    tileDiv.style.position = "absolute";
    tileDiv.style.top = (y * this.tileSize).toString();
    tileDiv.style.left = (x * this.tileSize).toString();
    const img = document.createElement("img") as HTMLImageElement;
    img.src = `${layoutSpriteRoute}${layoutTileImgMap[tile].imgSrc}`;
    tileDiv.appendChild(img);
    return tileDiv;
  };
  private checkLayoutBounds = (x: number, y: number) =>
    x >= 0 && x < this.layout.width && y >= 0 && y < this.layout.height;
  private getComplexTile = (x: number, y: number) => this.layout.tiles[y][x];
  getTile = (x: number, y: number) => this.layout.tiles[y][x].symbol;
  placeTile = (x: number, y: number, tile: ITile) => {
    const tileDiv = this.constructTileDiv(x, y, tile);
    this.canvas.appendChild(tileDiv);
    this.layout.tiles[y][x] = { symbol: tile, domRef: tileDiv };
  };
  removeTile = (x: number, y: number) => {
    const complexTile = this.layout.tiles[y][x];
    complexTile.domRef?.remove();
    this.layout.tiles[y][x] = { domRef: null, symbol: " " };
  };
}
