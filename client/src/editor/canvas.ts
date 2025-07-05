import { layoutTileImgMap } from "@client/easel/easelManager";
import { layoutSpriteRoute } from "@client/routes";
import { ITile } from "@stdTypes/sceneTypes";
import { TilePalette } from "./palette";

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
  tilePalette: TilePalette;
}

export class EditorCanvas {
  constructor(
    container: HTMLDivElement,
    params: IEditorCanvasConstructorParams
  ) {
    this.tilePalette = params.tilePalette;
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
    this.canvas.onauxclick = (ev) => {
      if (ev.button == 2) this.onClick(ev.clientX, ev.clientY, "lmb");
    };
    window.addEventListener("mouseup", (ev) => {
      if (ev.button === 1) this.onStopPan(ev.clientX, ev.clientY);
    });
    window.addEventListener("mousedown", (ev) => {
      if (ev.button === 1) this.onStartPan(ev.clientX, ev.clientY);
    });
    window.addEventListener("mousemove", (ev) =>
      this.onMouseMove(ev.clientX, ev.clientY)
    );
    container.appendChild(this.canvas);
  }

  private tilePalette: TilePalette;
  private isPanning = false;
  panStartPos: [number, number] = [0, 0];
  panStopPos: [number, number] = [0, 0];
  private onStartPan = (x: number, y: number) => {
    if (this.isPanning) return;
    this.isPanning = true;
    this.panStartPos = [x, y];
  };
  private onStopPan = (x: number, y: number) => {
    this.isPanning = false;
    this.panStopPos = [
      Number(this.canvas.style.left.replace("px", "")) ?? 0,
      Number(this.canvas.style.top.replace("px", "")) ?? 0,
    ];
  };
  private onMouseMove = (x: number, y: number) => {
    if (this.isPanning) {
      this.canvas.style.left =
        String(x - this.panStartPos[0] + this.panStopPos[0]) + "px";
      this.canvas.style.top =
        String(y - this.panStartPos[1] + this.panStopPos[1]) + "px";
    }
  };

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
      this.placeTile(xLayout, yLayout, this.tilePalette.getCurrentTile());
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
