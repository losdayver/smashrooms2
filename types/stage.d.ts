export interface LayoutMetaExt {
  stageName: string;
  /** MUST be the same as the file name */
  stageSystemName: string;
  gridSize: number;
  author?: string;
  /** for how long the stage will be played before change in seconds */
  timeLimit?: number;
  /** anything implementation specific goes here */ extra: any;
}

export interface StageExt {
  meta: LayoutMetaExt;
  layoutData: string;
}
