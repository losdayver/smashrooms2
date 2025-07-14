import {
  backgroundRoute,
  layoutSpriteRoute,
  propSpriteRoute,
} from "@client/routes";
import { ITileSymbols } from "@stdTypes/sceneTypes";
import { getDivElPos, minMax } from "@client/utils";
import { ILayoutProp, layoutPropMap, layoutTileImgMap } from "@client/common";
import { IEditorCommunications } from "./editor";
import { FocusManager, IFocusable } from "@client/focus/focusManager";
import { ControlsObjType } from "@client/config/config";

interface IComplexTile {
  symbol: ITileSymbols;
  domRef: HTMLDivElement | null;
}

interface ICanvasLayout {
  width: number;
  height: number;
  tiles: IComplexTile[][];
}

type ICanvasProp = ILayoutProp & {
  domRef: HTMLDivElement;
  dragStartedPos: [number, number];
  selected: boolean;
};
type ICanvasPropStorage = ICanvasProp[];

interface IEditorCanvasConstructorParams {
  width: number;
  height: number;
  communications: IEditorCommunications;
}

const mouseBtnMap = {
  0: "lmb",
  1: "mmb",
  2: "rmb",
} as const;

export class EditorCanvas implements IFocusable {
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
    this.canvas.onclick = (ev) =>
      this.unifiedMouseAction(ev.clientX, ev.clientY, "lmb", "click");
    this.canvas.onauxclick = (ev) =>
      ev.button == 2 &&
      this.unifiedMouseAction(ev.clientX, ev.clientY, "rmb", "click");
    window.addEventListener("mouseup", (ev) => {
      if (ev.button === 1) this.onStopPan();
      if (ev.button === 0) this.onStopPlacingTiles();
      if (ev.button === 2) this.onStopRemovingTiles();
      this.unifiedMouseAction(
        ev.clientX,
        ev.clientY,
        mouseBtnMap[ev.button],
        "release"
      );
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

  private isAltActionEnabled = false;
  getFocusTag = () => "canvas";
  onFocusReceiveKey = (
    key: keyof ControlsObjType,
    status: "down" | "up",
    realKeyCode: string
  ) => {
    if (this.getTargetMode() == "props") {
      if (status == "up") {
        if (key == "altAction") {
          this.isAltActionEnabled = false;
          this.canvas.style.cursor = "default";
        }
      } else if (status == "down") {
        if (key == "delete") {
          const propsToDelete = this.propStorage.filter(
            (prop) => prop.selected
          );
          propsToDelete.forEach((prop) => this.deleteProp(prop.domRef));
        } else if (key == "altAction") {
          this.isAltActionEnabled = true;
          this.canvas.style.cursor = "not-allowed";
        } else if (key == "back") this.unselectAllProps();
      }
    }
  };
  onFocused?: () => void | Promise<void>;
  onUnfocused?: () => void | Promise<void>;
  onFocusRegistered?: (focusManager: FocusManager) => void | Promise<void>;
  onFocusUnregistered?: () => void | Promise<void>;

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
    if (this.isPlacingTiles) this.unifiedMouseAction(x, y, "lmb", "drag");
    else if (this.isRemovingTiles) this.unifiedMouseAction(x, y, "rmb", "drag");
    else if (this.isPanning) {
      this.canvas.style.left =
        String(x - this.panStartPos[0] + this.panStopPos[0]) + "px";
      this.canvas.style.top =
        String(y - this.panStartPos[1] + this.panStopPos[1]) + "px";
    }
  };

  private gridSize = 32;
  private gridSnap = true;
  private dragStarted = false;
  private canPlaceProp = true;
  private isDragingProp = false;
  private cursorDragStartPos = [0, 0];
  private unifiedMouseAction = (
    xReal: number,
    yReal: number,
    button: "lmb" | "rmb" | "mmb",
    clickVariant: "click" | "drag" | "release"
  ) => {
    const { left, top } = this.canvas.getBoundingClientRect();
    const xRelative = (xReal - left) / this.zoomVals[0];
    const yRelative = (yReal - top) / this.zoomVals[1];
    const target = this.getTargetMode();
    if (target == "tiles") {
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
    } else if (target == "props") {
      const propUnderCursor = this.getPropUnderCursor(xReal, yReal);
      if (
        button == "lmb" &&
        clickVariant == "click" &&
        !this.isDragingProp &&
        this.canPlaceProp
      ) {
        if (this.isAltActionEnabled) {
          this.canPlaceProp = false;
          let pos = [xRelative, yRelative];
          if (this.gridSnap)
            pos = pos.map(
              (val) => Math.round(val / this.gridSize) * this.gridSize
            );
          const prop = this.placeProp(
            pos[0],
            pos[1],
            this.communications.propPalette.getCurrentColorKey() as keyof typeof layoutPropMap
          );
          this.unselectAllProps();
          this.selectProp(prop.domRef);
        } else if (propUnderCursor) {
          this.selectProp(propUnderCursor.domRef);
          return;
        }
      } else if (button == "rmb" && clickVariant == "drag") {
        const selectedProps = this.propStorage.filter((prop) => prop.selected);
        if (!selectedProps.length) return;
        let loopDragStarted = true;
        if (!this.dragStarted) {
          loopDragStarted = false;
          this.dragStarted = true;
          this.canvas.style.cursor = "move";
          this.cursorDragStartPos = [xRelative, yRelative];
        }
        for (const selectedProp of selectedProps) {
          if (!loopDragStarted) {
            selectedProp.dragStartedPos = getDivElPos(selectedProp.domRef);
          }
          let divPos = [
            selectedProp.dragStartedPos[0] -
              this.cursorDragStartPos[0] +
              xRelative,
            selectedProp.dragStartedPos[1] -
              this.cursorDragStartPos[1] +
              yRelative,
          ];
          if (this.gridSnap)
            divPos = divPos.map(
              (val) => Math.round(val / this.gridSize) * this.gridSize
            );
          selectedProp.domRef.style.left = String(divPos[0]) + "px";
          selectedProp.domRef.style.top = String(divPos[1]) + "px";
          selectedProp.prop.positioned = { posX: xRelative, posY: yRelative };
        }
      }
    }
    if (clickVariant == "release") {
      if (button == "rmb") {
        this.canvas.style.cursor = "default";
        this.dragStarted = false;
      }
    }
  };

  private getPropUnderCursor = (x: number, y: number) => {
    return this.propStorage.find((prop) => {
      const rect = prop.domRef.getBoundingClientRect();
      return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      );
    });
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
      dragStartedPos: [0, 0],
      selected: false,
    };
    return prop;
  };
  private checkLayoutBounds = (x: number, y: number) =>
    x >= 0 && x < this.layout.width && y >= 0 && y < this.layout.height;
  private getComplexTile = (x: number, y: number) => this.layout.tiles[y][x];

  getTargetMode = (): "props" | "tiles" =>
    this.communications.tabs.getActiveTab().label as "props" | "tiles";

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
    return prop;
  };
  selectProp = (domRef: HTMLDivElement) => {
    const propToSelect = this.propStorage.find((prop) => prop.domRef == domRef);
    if (!propToSelect) return;
    if (propToSelect.selected) {
      propToSelect.domRef.classList.remove(
        "smsh-editor-canvas__prop--selected"
      );
      propToSelect.selected = false;
      return;
    }
    propToSelect.domRef.classList.add("smsh-editor-canvas__prop--selected");
    propToSelect.selected = true;
  };
  unselectAllProps = () => {
    this.propStorage.forEach((prop) => {
      prop.selected = false;
      prop.domRef.classList.remove("smsh-editor-canvas__prop--selected");
    });
  };
  deleteProp = (domRef: HTMLDivElement) => {
    const propIndex = this.propStorage.findIndex(
      (prop) => prop.domRef == domRef
    );
    domRef.remove();
    this.propStorage = [
      ...this.propStorage.splice(0, propIndex),
      ...this.propStorage.splice(propIndex),
    ];
  };
}
