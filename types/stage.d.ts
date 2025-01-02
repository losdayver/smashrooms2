export interface LayoutMetaExt {
  stageName: string;
  stageSystemName: string;
  gridSize: number;
  author?: string;
  /** anything implementation specific goes here */ extra: any;
}

export interface StageExt {
  meta: LayoutMetaExt;
  layoutData: string;
}
