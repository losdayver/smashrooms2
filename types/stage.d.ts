export interface LayoutMetaExt {
  stageName: string;
  stageSystemName: string;
  gridSize: number;
  author?: string;
}

export interface StageExt {
  meta: LayoutMetaExt;
  layoutData: string;
}
