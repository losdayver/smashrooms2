import { EditorCanvas, ICanvasProp } from "@client/editor/canvas";
import { TilePalette } from "@client/editor/tilePalette";
import { PropPalette } from "./propPalette";
import { Tabs } from "@client/ui/tabs";
import { FocusManager } from "@client/focus/focusManager";
import { Toast } from "@client/ui/toast";
import { Toolbar } from "./toolbar";
import { Collection } from "@client/ui/collection";

export interface IEditorCommunications {
  tilePalette: TilePalette;
  propPalette: PropPalette;
  canvas: EditorCanvas;
  tabs: Tabs<["tiles", "props"]>;
  focusManager: FocusManager;
  toast: Toast;
  statusBar: {
    stageName: HTMLDivElement;
  };
  propColleciton: Collection<ICanvasProp>;
}

export const editorLoader = () => {
  const propColleciton = new Collection(
    document.querySelector(".editor__workplace__left-sidebar__prop-list")
  );

  const stageName = document.createElement("div");
  stageName.innerText = "not selected";
  const statusDiv = document.querySelector(".editor__statusbar");
  statusDiv.append(stageName);
  const statusBar = {
    stageName,
  };

  const focusManager = new FocusManager();
  const toast = new Toast(document.querySelector(".toast-container"));

  const tabs = new Tabs<["tiles", "props"]>(
    document.querySelector(".editor__workplace__left-sidebar__tabs"),
    { labels: ["tiles", "props"] }
  );
  const contents = tabs.getTabs().map((el) => el.contentsRef);
  const tilePalette = new TilePalette(contents[0]);
  const propPalette = new PropPalette(contents[1]);
  const communications: Partial<IEditorCommunications> = {
    tilePalette,
    propPalette,
    tabs,
    focusManager,
    toast,
    statusBar,
    propColleciton,
  };

  const toolbar = new Toolbar(
    document.querySelector(".editor__toolbar"),
    communications as IEditorCommunications
  );
};
