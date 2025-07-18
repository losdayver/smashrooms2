import { EditorCanvas } from "@client/editor/canvas";
import { TilePalette } from "@client/editor/tilePalette";
import { PropPalette } from "./propPalette";
import { Tabs } from "@client/ui/tabs";
import { FocusManager } from "@client/focus/focusManager";
import { Toast } from "@client/ui/toast";

export interface IEditorCommunications {
  tilePalette: TilePalette;
  propPalette: PropPalette;
  canvas: EditorCanvas;
  tabs: Tabs<["tiles", "props"]>;
  focusManager: FocusManager;
  toast: Toast;
}

export const editorLoader = () => {
  const focusManager = new FocusManager();
  const toast = new Toast(document.querySelector(".toast-container"));

  const tabs = new Tabs<["tiles", "props"]>(
    document.querySelector(".editor__workplace__left-sidebar__tabs"),
    {
      labels: ["tiles", "props"],
    }
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
  };
  const canvas = new EditorCanvas(
    document.querySelector(".editor__workplace__canvas-container"),
    {
      width: 200,
      height: 200,
      communications: communications as IEditorCommunications,
    }
  );
  communications.canvas = canvas;
  focusManager.register(canvas);
  focusManager.setFocus(canvas.getFocusTag());
};
