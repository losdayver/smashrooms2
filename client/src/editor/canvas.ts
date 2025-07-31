import {
  backgroundRoute,
  layoutSpriteRoute,
  propSpriteRoute,
} from "@client/routes";
import { ITileSymbols, PropBehavioursExt } from "@stdTypes/sceneTypes";
import { getDivElPos, makeIconButton, minMax } from "@client/utils";
import {
  IDestructible,
  ILayoutProp,
  layoutPropMap,
  layoutTileImgMap,
} from "@client/common";
import { IEditorCommunications } from "./editor";
import { IFocusable } from "@client/focus/focusManager";
import { ControlsObjType } from "@client/config/config";
import { JsonEditorModal } from "@client/modal/jsonEditorModal";
import { ISmshStageMetaExtra, LayoutMetaExt, StageExt } from "@stdTypes/stage";

interface IComplexTile {
  symbol: ITileSymbols;
  domRef: HTMLDivElement | null;
}

interface ICanvasTileLayout {
  width: number;
  height: number;
  tiles: IComplexTile[][];
}

type ICanvasProp = ILayoutProp & {
  behavioursRef: { ref: PropBehavioursExt };
  domRef: HTMLDivElement;
  controlsDomRef: HTMLDivElement;
  dragStartedPos: [number, number];
  selected: boolean;
};
type ICanvasPropStorage = ICanvasProp[];

interface IEditorCanvasConstructorParams {
  width?: number;
  height?: number;
  meta?: LayoutMetaExt;
  layout?: string;
  communications: IEditorCommunications;
}

export class EditorCanvas implements IFocusable, IDestructible {
  constructor(
    container: HTMLDivElement,
    params: IEditorCanvasConstructorParams
  ) {
    this.container = container;
    this.communications = params.communications;
    container.style.backgroundImage = `url(${backgroundRoute}forest.png)`;
    this.canvas = document.createElement("div");
    this.canvas.className = "smsh-editor-canvas";

    const actionWrapper = document.createElement("div");
    actionWrapper.style.width = "100%";
    actionWrapper.style.height = "100%";

    actionWrapper.onclick = (ev) =>
      this.unifiedMouseAction(ev.clientX, ev.clientY, "lmb", "click");
    this.canvas.onauxclick = (ev) => {
      if (!this.focused) return;
      ev.button == 2 &&
        this.unifiedMouseAction(ev.clientX, ev.clientY, "rmb", "click");
    };
    actionWrapper.addEventListener("mouseup", (ev) => {
      if (!this.focused) return;
      if (ev.button === 1) this.onStopPan();
      else if (ev.button === 0) this.onStopPlacingTiles();
      else if (ev.button === 2) this.onStopRemovingTiles();
      this.unifiedMouseAction(
        ev.clientX,
        ev.clientY,
        this.mouseBtnMap[ev.button],
        "release"
      );
    });
    actionWrapper.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if (!this.focused) return;
      if (ev.button === 1) this.onStartPan(ev.clientX, ev.clientY);
      else if (ev.button === 0) this.onStartPlacingTiles();
      else if (ev.button === 2) this.onStartRemovingTiles();
    });
    actionWrapper.addEventListener("mousemove", (ev) => {
      if (!this.focused) return;
      this.onMouseMove(ev.clientX, ev.clientY);
    });
    actionWrapper.addEventListener("wheel", (ev) => {
      if (!this.focused) return;
      if (ev.deltaY < 0) this.zoom("in");
      else this.zoom("out");
    });

    if (params.layout) {
      const layout = params.layout.split(/\r\n|\r|\n/);
      this.layout = {
        height: layout.length,
        width: layout[0].length,
        tiles: layout.map((line, y) =>
          Array.from(line).map((symbol, x) => {
            const tileDiv =
              symbol == " "
                ? null
                : this.constructTileDiv(x, y, symbol as ITileSymbols);
            tileDiv && this.canvas.appendChild(tileDiv);
            return {
              symbol: symbol as ITileSymbols,
              domRef: tileDiv,
            };
          })
        ),
      };
    } else {
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
    }

    if (params.meta?.extra.preload) {
      const preload = params.meta?.extra.preload;
      preload.forEach((prop) => {
        this.placeProp(
          prop.behaviours.positioned.posX,
          prop.behaviours.positioned.posY,
          prop.name,
          prop.behaviours
        );
      });
    }

    actionWrapper.appendChild(this.canvas);
    container.appendChild(actionWrapper);
  }
  // IDestructible
  destructor() {
    this.communications.focusManager.unregister(this);
    Array.from(this.container.children).forEach((child) => child.remove());
  }

  private container: HTMLDivElement;
  private canvas: HTMLDivElement;
  private layout: ICanvasTileLayout;
  private isAltActionEnabled = false;
  private tileSize = 32;
  private propStorage: ICanvasPropStorage = [];
  private communications: IEditorCommunications;
  private isPanning = false;
  private panStartPos: [number, number] = [0, 0];
  private panStopPos: [number, number] = [0, 0];
  private gridSize = 16;
  private gridSnap = true;
  private dragStarted = false;
  private isDragingProp = false;
  private cursorDragStartPos = [0, 0];
  private focused = false;
  private zoomVals: [number, number] = [1, 1];
  private mouseBtnMap = {
    0: "lmb",
    1: "mmb",
    2: "rmb",
  };

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
      if (button == "lmb" && clickVariant == "click" && !this.isDragingProp) {
        if (this.isAltActionEnabled && !propUnderCursor) {
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
              (val) => Math.floor(val / this.gridSize) * this.gridSize
            );
          selectedProp.domRef.style.left = String(divPos[0]) + "px";
          selectedProp.domRef.style.top = String(divPos[1]) + "px";
          selectedProp.beahaviours.positioned = {
            posX: divPos[0],
            posY: divPos[1],
          };
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
  private constructTileDiv = (x: number, y: number, tile: ITileSymbols) => {
    const tileDiv = document.createElement("div");
    tileDiv.className = "smsh-editor-canvas__tile";
    tileDiv.style.zIndex = String(x * 10000 + y);
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
    propName: keyof typeof layoutPropMap,
    behaviours?: PropBehavioursExt
  ) => {
    const propDiv = document.createElement("div");
    propDiv.className = "smsh-editor-canvas__prop";
    propDiv.style.position = "absolute";
    propDiv.style.top = String(y) + "px";
    propDiv.style.left = String(x) + "px";
    if (layoutPropMap[propName].offset)
      propDiv.style.transform = `translate(${layoutPropMap[propName].offset
        .map((val) => val + "px")
        .join(", ")})`;
    const img = document.createElement("img") as HTMLImageElement;
    img.src = `${propSpriteRoute}${layoutPropMap[propName].imgPath}`;
    propDiv.appendChild(img);
    const behavioursRef = {
      ref:
        behaviours ??
        JSON.parse(JSON.stringify(layoutPropMap[propName].beahaviours)),
    };
    const controlsDiv = document.createElement("div");
    const deleteBtn = makeIconButton(
      "cross.png",
      () => {
        this.deleteProp(propDiv);
      },
      [30, 20]
    );
    const editBtn = makeIconButton(
      "edit.png",
      () => {
        const modal = new JsonEditorModal(
          document.querySelector(".modal-container"),
          this.communications.focusManager,
          this.communications.toast,
          behavioursRef
        );
        this.communications.focusManager.register(modal);
        this.communications.focusManager.setFocus(modal.getFocusTag());
        modal.show();
      },
      [30, 20]
    );
    deleteBtn.innerText = "D";
    controlsDiv.append(editBtn, deleteBtn);
    controlsDiv.classList.add("smsh-editor-canvas__prop__controls");
    controlsDiv.style.visibility = "hidden";
    propDiv.append(controlsDiv);
    const prop: ICanvasProp = {
      ...layoutPropMap[propName],
      domRef: propDiv,
      beahaviours: {
        ...layoutPropMap[propName].beahaviours,
        positioned: { posX: x, posY: y },
      },
      dragStartedPos: [0, 0],
      selected: false,
      controlsDomRef: controlsDiv,
      behavioursRef,
    };
    return prop;
  };
  private checkLayoutBounds = (x: number, y: number) =>
    x >= 0 && x < this.layout.width && y >= 0 && y < this.layout.height;
  private getComplexTile = (x: number, y: number) => this.layout.tiles[y][x];

  // IFocusable
  getFocusTag = () => "canvas";
  onFocusReceiveKey = (key: keyof ControlsObjType, status: "down" | "up") => {
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
          this.canvas.style.cursor = "pointer";
        } else if (key == "back") this.unselectAllProps();
      }
    }
  };
  onFocused = () => {
    this.focused = true;
  };
  onUnfocused = () => {
    this.focused = false;
  };
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
  placeProp = (
    x: number,
    y: number,
    propName: keyof typeof layoutPropMap,
    behaviours?: PropBehavioursExt
  ) => {
    const prop = this.constructProp(x, y, propName, behaviours);
    this.canvas.appendChild(prop.domRef);
    this.propStorage.push(prop);
    return prop;
  };
  selectProp = (domRef: HTMLDivElement) => {
    const propToSelect = this.propStorage.find((prop) => prop.domRef == domRef);
    if (!this.isAltActionEnabled)
      this.propStorage.forEach((prop) => {
        if (prop.domRef != domRef) {
          prop.domRef.classList.remove("smsh-editor-canvas__prop--selected");
          prop.selected = false;
          prop.controlsDomRef.style.visibility = "hidden";
        }
      });
    if (!propToSelect) return;
    if (propToSelect.selected) {
      propToSelect.domRef.classList.remove(
        "smsh-editor-canvas__prop--selected"
      );
      propToSelect.selected = false;
      propToSelect.controlsDomRef.style.visibility = "hidden";
      return;
    }
    propToSelect.domRef.classList.add("smsh-editor-canvas__prop--selected");
    propToSelect.selected = true;
    propToSelect.controlsDomRef.style.visibility = "visible";
  };
  unselectAllProps = () => {
    this.propStorage.forEach((prop) => {
      prop.selected = false;
      prop.domRef.classList.remove("smsh-editor-canvas__prop--selected");
      prop.controlsDomRef.style.visibility = "hidden";
    });
  };
  deleteProp = (domRef: HTMLDivElement) => {
    const propIndex = this.propStorage.findIndex(
      (prop) => prop.domRef == domRef
    );
    domRef.remove();
    this.propStorage = this.propStorage.filter(
      (_, index) => index != propIndex
    );
  };
  extractLayoutData = (): StageExt["layoutData"] => {
    return new Array(this.layout.height)
      .fill(0)
      .map((_, index) =>
        this.layout.tiles[index].map((tile) => tile.symbol).join("")
      )
      .join("\n");
  };
  extractStageMetaExtra = (): ISmshStageMetaExtra => {
    return {
      preload: this.propStorage.map((prop) => ({
        name: prop.name,
        behaviours: {
          positioned: {
            posX: Math.floor(prop.beahaviours.positioned.posX),
            posY: Math.floor(prop.beahaviours.positioned.posY),
          },
          ...prop.behavioursRef.ref,
        },
      })),
    };
  };
}
