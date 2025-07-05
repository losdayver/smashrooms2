import { EditorCanvas } from "@client/editor/canvas";
export const editorLoader = () => {
  const canvas = new EditorCanvas(
    document.querySelector(".editor__workplace__canvas-container"),
    { width: 32, height: 32 }
  );
  canvas.placeTile(5, 5, "#");
};
