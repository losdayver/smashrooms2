import { ITileSymbols, PropBehavioursExt } from "@stdTypes/sceneTypes";

export interface ILayoutTile {
  imgPath: string;
}

export interface ILayoutProp {
  imgPath: string;
  name: string;
  prop: PropBehavioursExt;
}

export const layoutPropMap: Partial<Record<string, ILayoutProp>> = {
  player: {
    imgPath: "playerIdle.gif",
    name: "playerSpawner",
    prop: {},
  },
  bomb: {
    imgPath: "bomb.gif",
    name: "bomb",
    prop: {},
  },
} as const;

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
} as const;
