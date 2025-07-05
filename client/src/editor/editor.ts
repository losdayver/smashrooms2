import { EditorCanvas } from "@client/editor/canvas";
import { TilePalette } from "@client/editor/palette";
export const editorLoader = () => {
  window.addEventListener("mousedown", (event) => {
    if (event.button === 1) event.preventDefault();
  });
  const tilePalette = new TilePalette(
    document.querySelector(
      ".editor__workplace__left-sidebar__palette__tiles-container"
    )
  );
  const canvas = new EditorCanvas(
    document.querySelector(".editor__workplace__canvas-container"),
    {
      width: 32,
      height: 32,
      tilePalette,
    }
  );
  canvas.placeTile(5, 5, "#");
};
