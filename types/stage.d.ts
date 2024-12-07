export interface LayoutMetaExt {
  stageName: string;
  stageSystemName: string;
  author?: string;
}

export interface StageExt {
  meta: LayoutMetaExt;
  layoutData: string;
}
