import { LayoutMetaExt } from "@stdTypes/stage";
import { IEditorCommunications } from "./editor";
import {
  IEditorUploadIncomingBody,
  IEditorUploadOutgoingBody,
} from "@stdTypes/apiTypes";
import { EditorCanvas } from "./canvas";

export class Toolbar {
  constructor(
    container: HTMLDivElement,
    communications: IEditorCommunications
  ) {
    const testBtn = document.createElement("button");
    const loadBtn = document.createElement("button");
    const saveBtn = document.createElement("button");
    loadBtn.className = saveBtn.className = testBtn.className = "smsh-button";
    testBtn.onclick = this.playTest;
    loadBtn.onclick = this.loadStage;
    saveBtn.onclick = this.saveStage;
    testBtn.innerText = "run";
    loadBtn.innerText = "load from server";
    saveBtn.innerText = "save stage";
    this.communications = communications;
    container.append(testBtn, loadBtn, saveBtn);
  }

  private communications: IEditorCommunications;

  saveStage = async () => {
    const extra = this.communications.canvas.extractStageMetaExtra();
    const layoutData = this.communications.canvas.extractLayoutData();
    const meta: LayoutMetaExt = {
      gridSize: 32,
      timeLimit: 200,
      author: "system",
      stageName: "editor_test",
      stageSystemName: "editor_test",
      extra,
    };
    const payload: IEditorUploadIncomingBody = {
      meta: btoa(JSON.stringify(meta)),
      layoutData: btoa(layoutData),
    };
    const res = await fetch(
      `http://${window.location.hostname}:5900/editor/save`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    this.communications.toast.notify(
      res.ok ? "staged saved" : "failed to save",
      res.ok ? "info" : "danger"
    );
  };
  playTest = async () => {
    const extra = this.communications.canvas.extractStageMetaExtra();
    const layoutData = this.communications.canvas.extractLayoutData();
    const meta: LayoutMetaExt = {
      gridSize: 32,
      timeLimit: 200,
      author: "system",
      stageName: "editor_test",
      stageSystemName: "editor_test",
      extra,
    };
    const payload: IEditorUploadIncomingBody = {
      meta: btoa(JSON.stringify(meta)),
      layoutData: btoa(layoutData),
    };
    const res = await fetch(
      `http://${window.location.hostname}:5900/editor/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const parsedRes = (await res.json()) as IEditorUploadOutgoingBody;
    window.open(
      `http://${window.location.host}${parsedRes.testingUrlParams}`,
      "_blank"
    );
  };
  loadStage = async () => {
    const layoutText = await fetch(
      `http://${window.location.hostname}:5900/editor/load/layout/editor_test`,
      {
        method: "GET",
        headers: {
          "Content-Type": "text/plain",
        },
      }
    ).then((res) => res.text());
    const layout = atob(layoutText);
    const meta = JSON.parse(
      atob(
        await fetch(
          `http://${window.location.hostname}:5900/editor/load/meta/editor_test`,
          {
            method: "GET",
            headers: {
              "Content-Type": "text/plain",
            },
          }
        ).then((res) => res.text())
      )
    );

    this.communications.canvas.destructor();
    const canvas = new EditorCanvas(
      document.querySelector(".editor__workplace__canvas-container"),
      {
        layout,
        meta,
        communications: this.communications,
      }
    );
    this.communications.canvas = canvas;
    this.communications.focusManager.register(canvas);
    this.communications.focusManager.setFocus(canvas.getFocusTag());
  };
}
