import {
  backgroundRoute,
  layoutSpriteRoute,
  propSpriteRoute,
} from "@client/routes";
import { ITileSymbols } from "@stdTypes/sceneTypes";
import { TilePalette } from "./tilePalette";
import { minMax } from "@client/utils";
import { ICanvasPropBehaviours } from "./types";
import { ILayoutProp, layoutPropMap, layoutTileImgMap } from "@client/common";
import { IEditorCommunications } from "./editor";

interface IComplexTile {
  symbol: ITileSymbols;
  domRef: HTMLDivElement | null;
}

interface ICanvasLayout {
  width: number;
  height: number;
  tiles: IComplexTile[][];
}

type ICanvasProp = ILayoutProp & { domRef: HTMLDivElement };
type ICanvasPropStorage = ICanvasProp[];

interface IEditorCanvasConstructorParams {
  width: number;
  height: number;
  communications: IEditorCommunications;
}

export class EditorCanvas {
  constructor(
    container: HTMLDivElement,
    params: IEditorCanvasConstructorParams
  ) {
    this.communications = params.communications;
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
    this.canvas.className = "smsh-editor-canvas";
    this.canvas.onclick = (ev) => this.onClick(ev.clientX, ev.clientY, "lmb");
    this.canvas.onauxclick = (ev) =>
      ev.button == 2 && this.onClick(ev.clientX, ev.clientY, "rmb");
    window.addEventListener("mouseup", (ev) => {
      if (ev.button === 1) this.onStopPan();
      if (ev.button === 0) this.onStopPlacingTiles();
      if (ev.button === 2) this.onStopRemovingTiles();
    });
    window.addEventListener("mousedown", (ev) => {
      this.canPlaceProp = true;
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

  private communications: IEditorCommunications;
  private isPanning = false;
  private panStartPos: [number, number] = [0, 0];
  private panStopPos: [number, number] = [0, 0];
  private onStartPan = (x: number, y: number) => {
    if (this.isPanning) return;
    this.isPanning = true;
    this.panStartPos = [x, y];
  };
  private onStopPan = () => {
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
  private canPlaceProp = true;
  private onClick = (
    xReal: number,
    yReal: number,
    button: "lmb" | "rmb" | "mmb"
  ) => {
    const { left, top } = this.canvas.getBoundingClientRect();
    const xRelative = (xReal - left) / this.zoomVals[0];
    const yRelative = (yReal - top) / this.zoomVals[1];
    const tabLabel = this.communications.tabs.getActiveTab().label;
    if (tabLabel == "tiles") {
      const xLayout = Math.floor(xRelative / this.tileSize);
      const yLayout = Math.floor(yRelative / this.tileSize);
      if (!this.checkLayoutBounds(xLayout, yLayout)) return;
      if (button == "lmb") {
        if (
          this.getTile(xLayout, yLayout) !=
          this.communications.tilePalette.getCurrentColorKey()
        )
          this.removeTile(xLayout, yLayout);
        if (this.getTile(xLayout, yLayout) == " ")
          this.placeTile(
            xLayout,
            yLayout,
            this.communications.tilePalette.getCurrentColorKey() as ITileSymbols
          );
      } else if (button == "rmb") this.removeTile(xLayout, yLayout);
    } else if (tabLabel == "props" && this.canPlaceProp) {
      if (button == "lmb") {
        this.canPlaceProp = false;
        this.placeProp(
          xRelative,
          yRelative,
          this.communications.propPalette.getCurrentColorKey() as keyof typeof layoutPropMap
        );
      }
    }
  };

  private tileSize = 32;
  private canvas: HTMLDivElement;
  private layout: ICanvasLayout;
  private propStorage: ICanvasPropStorage = [];

  private constructTileDiv = (x: number, y: number, tile: ITileSymbols) => {
    const tileDiv = document.createElement("div");
    tileDiv.className = "smsh-editor-canvas__tile";
    tileDiv.style.zIndex = String(x * 1000 + y);
    tileDiv.style.position = "absolute";
    tileDiv.style.top = (y * this.tileSize).toString();
    tileDiv.style.left = (x * this.tileSize).toString();
    const img = document.createElement("img") as HTMLImageElement;
    img.src = `${layoutSpriteRoute}${layoutTileImgMap[tile].imgPath}`;
    tileDiv.appendChild(img);
    return tileDiv;
  };
  private constructProp = (
    x: number,
    y: number,
    propName: keyof typeof layoutPropMap
  ) => {
    const propDiv = document.createElement("div");
    propDiv.className = "smsh-editor-canvas__prop";
    propDiv.style.position = "absolute";
    propDiv.style.top = String(y) + "px";
    propDiv.style.left = String(x) + "px";
    const img = document.createElement("img") as HTMLImageElement;
    img.src = `${propSpriteRoute}${layoutPropMap[propName].imgPath}`;
    propDiv.appendChild(img);
    const prop: ICanvasProp = {
      ...layoutPropMap[propName],
      domRef: propDiv,
      prop: {
        ...layoutPropMap[propName].prop,
        positioned: { posX: x, posY: y },
      },
    };
    return prop;
  };
  private checkLayoutBounds = (x: number, y: number) =>
    x >= 0 && x < this.layout.width && y >= 0 && y < this.layout.height;
  private getComplexTile = (x: number, y: number) => this.layout.tiles[y][x];
  getTile = (x: number, y: number) => this.layout.tiles[y][x].symbol;
  placeTile = (x: number, y: number, tile: ITileSymbols) => {
    const tileDiv = this.constructTileDiv(x, y, tile);
    this.canvas.appendChild(tileDiv);
    this.layout.tiles[y][x] = { symbol: tile, domRef: tileDiv };
  };
  removeTile = (x: number, y: number) => {
    const complexTile = this.layout.tiles[y][x];
    complexTile.domRef?.remove();
    this.layout.tiles[y][x] = { domRef: null, symbol: " " };
  };

  placeProp = (x: number, y: number, propName: keyof typeof layoutPropMap) => {
    const prop = this.constructProp(x, y, propName);
    this.canvas.appendChild(prop.domRef);
    this.propStorage.push(prop);
  };
}
