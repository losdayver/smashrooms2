import { layoutTileImgMap } from "@client/easel/easelManager";
import { backgroundRoute, layoutSpriteRoute } from "@client/routes";
import { ITile } from "@stdTypes/sceneTypes";
import { TilePalette } from "./palette";
import { minMax } from "@client/utils";

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
    container.style.backgroundImage = `url(${backgroundRoute}forest.png)`;
    this.canvas = document.createElement("div");
    this.canvas.className =
      "editor__workplace__editor__workplace__canvas-container__canvas";
    window.addEventListener("mouseup", (ev) => {
      if (ev.button === 1) this.onStopPan(ev.clientX, ev.clientY);
      if (ev.button === 0) this.onStopPlacingTiles();
      if (ev.button === 2) this.onStopRemovingTiles();
    });
    window.addEventListener("mousedown", (ev) => {
      if (ev.button === 1) this.onStartPan(ev.clientX, ev.clientY);
      if (ev.button === 0) this.onStartPlacingTiles();
      if (ev.button === 2) this.onStartRemovingTiles();
    });
    window.addEventListener("mousemove", (ev) =>
      this.onMouseMove(ev.clientX, ev.clientY)
    );
    addEventListener("wheel", (ev) => {
      if (ev.deltaY < 0) this.zoom("in");
      else this.zoom("out");
    });

    container.appendChild(this.canvas);
  }

  private tilePalette: TilePalette;
  private isPanning = false;
  private panStartPos: [number, number] = [0, 0];
  private panStopPos: [number, number] = [0, 0];
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

  private zoomVals: [number, number] = [1, 1];
  private zoom = (target: "in" | "out") => {
    const value = target == "in" ? 0.1 : -0.1;
    this.zoomVals = [
      minMax(this.zoomVals[0] + value, 0.2, 2),
      minMax(this.zoomVals[1] + value, 0.2, 2),
    ];
    this.canvas.style.transform = `scale(${this.zoomVals[0]},${this.zoomVals[1]})`;
  };

  private isPlacingTiles = false;
  private onStartPlacingTiles = () => {
    if (this.isPlacingTiles) return;
    this.isPlacingTiles = true;
  };
  private onStopPlacingTiles = () => {
    this.isPlacingTiles = false;
  };

  private isRemovingTiles = false;
  private onStartRemovingTiles = () => {
    if (this.isRemovingTiles) return;
    this.isRemovingTiles = true;
  };
  private onStopRemovingTiles = () => {
    this.isRemovingTiles = false;
  };

  private onMouseMove = (x: number, y: number) => {
    if (this.isPlacingTiles) this.onClick(x, y, "lmb");
    else if (this.isRemovingTiles) this.onClick(x, y, "rmb");
    else if (this.isPanning) {
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
    const xLayout = Math.floor(xRelative / this.tileSize / this.zoomVals[0]);
    const yLayout = Math.floor(yRelative / this.tileSize / this.zoomVals[1]);
    if (!this.checkLayoutBounds(xLayout, yLayout)) return;
    if (button == "lmb") {
      if (this.getTile(xLayout, yLayout) != this.tilePalette.getCurrentTile())
        this.removeTile(xLayout, yLayout);
      if (this.getTile(xLayout, yLayout) == " ")
        this.placeTile(xLayout, yLayout, this.tilePalette.getCurrentTile());
    } else if (button == "rmb") this.removeTile(xLayout, yLayout);
  };

  private tileSize = 32;
  private canvas: HTMLDivElement;
  private layout: ILayout;

  private constructTileDiv = (x: number, y: number, tile: ITile) => {
    const tileDiv = document.createElement("div");
    tileDiv.className =
      "editor__workplace__editor__workplace__canvas-container__canvas__tile";
    tileDiv.style.zIndex = String(x * 1000 + y);
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
