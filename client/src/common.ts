import { ITileSymbols } from "@stdTypes/sceneTypes";

export interface ILayoutTile {
  imgPath: string;
}

export interface IPropTile {
  imgPath: string;
}

export const layoutPropImgMap: Partial<Record<string, ILayoutTile>> = {
  player: {
    imgPath: "playerIdle.gif",
  },
  bomb: {
    imgPath: "bomb.gif",
  },
};

export const layoutTileImgMap: Partial<Record<ITileSymbols, ILayoutTile>> = {
  "#": {
    imgPath: "bricks.png",
  },
  "=": {
    imgPath: "metalBeam.png",
  },
  G: {
    imgPath: "deepGround.png",
  },
  g: {
    imgPath: "grass.png",
  },
  l: {
    imgPath: "leaves.png",
  },
  s: {
    imgPath: "stone.png",
  },
  m: {
    imgPath: "metal.png",
  },
  b: {
    imgPath: "box.png",
  },
};
