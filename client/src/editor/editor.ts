import { EditorCanvas } from "@client/editor/canvas";
import { TilePalette } from "@client/editor/tilePalette";
import { PropPalette } from "./propPalette";

export const editorLoader = () => {
  window.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });
  const tilePalette = new TilePalette(
    document.querySelector(
      ".editor__workplace__left-sidebar__palette__tiles-container"
    )
  );
  const propPalette = new PropPalette(
    document.querySelector(
      ".editor__workplace__left-sidebar__palette__props-container"
    )
  );
  const canvas = new EditorCanvas(
    document.querySelector(".editor__workplace__canvas-container"),
    {
      width: 200,
      height: 200,
      tilePalette,
    }
  );
  canvas.placeTile(5, 5, "#");
};
