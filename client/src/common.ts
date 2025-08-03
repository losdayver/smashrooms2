import {
  IPortalExt,
  ISpawnerExt,
  ITileSymbols,
  PropBehavioursExt,
} from "@stdTypes/sceneTypes";

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
  playerSpawner: {
    imgPath: "playerIdle.gif",
    name: "playerSpawner",
    beahaviours: {},
    offset: [-16, 0],
  },
  portal: {
    imgPath: "portal.gif",
    name: "portal",
    beahaviours: {
      portal: {
        portalID: "1",
      },
    } satisfies IPortalExt,
    offset: [-16, 0],
  },
  itemSpawner: {
    imgPath: "itemSpawner.gif",
    name: "itemSpawner",
    beahaviours: {
      spawner: {
        props: ["shotgunItem", "pistolItem", "blasterItem", "medikitItem"],
        spawnDelay: 120,
      },
    } satisfies ISpawnerExt,
    offset: [-16, 0],
  },
} as const;

export const layoutTileImgMap: Partial<Record<ITileSymbols, ILayoutTile>> = {
  "#": { imgPath: "bricks.png" },
  "=": { imgPath: "metalBeam.png" },
  G: { imgPath: "deepGround.png" },
  g: { imgPath: "grass.png" },
  l: { imgPath: "leaves.png" },
  s: { imgPath: "stone.png" },
  m: { imgPath: "metal.png" },
  b: { imgPath: "box.png" },
  B: { imgPath: "boxBroken1.png" },
  D: { imgPath: "boxBroken2.png" },
  C: { imgPath: "reinforcedConcrete.png" },
} as const;

export interface IDestructible {
  destructor: () => void;
}
