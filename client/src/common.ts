import { ITileSymbols, PropBehavioursExt } from "@stdTypes/sceneTypes";

export interface ILayoutTile {
  imgPath: string;
}

export interface ILayoutProp {
  imgPath: string;
  name: string;
  offset?: [number, number];
  beahaviours: PropBehavioursExt;
}

export const layoutPropMap: Partial<Record<string, ILayoutProp>> = {
  player: {
    imgPath: "playerIdle.gif",
    name: "playerSpawner",
    beahaviours: {},
    offset: [-16, 0],
  },
  bomb: {
    imgPath: "bomb.gif",
    name: "bomb",
    beahaviours: {},
  },
  portal: {
    imgPath: "portal.gif",
    name: "portal",
    beahaviours: {
      portal: {
        portalID: "1",
      },
    },
    offset: [-16, 0],
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
