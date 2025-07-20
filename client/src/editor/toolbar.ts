import { LayoutMetaExt } from "@stdTypes/stage";
import { IEditorCommunications } from "./editor";
import {
  IEditorUploadIncomingBody,
  IEditorUploadOutgoingBody,
} from "@stdTypes/apiTypes";

export class Toolbar {
  constructor(
    container: HTMLDivElement,
    communications: IEditorCommunications
  ) {
    const testBtn = document.createElement("button");
    testBtn.className = "smsh-button";
    testBtn.onclick = this.playTest;
    testBtn.innerText = "run";
    this.communications = communications;
    container.append(testBtn);
  }

  private communications: IEditorCommunications;

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
    console.log(parsedRes);
  };
}
