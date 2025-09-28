import { LayoutMetaExt } from "@stdTypes/stage";
import { IEditorCommunications } from "./editor";
import {
  IEditorUploadIncomingBody,
  IEditorUploadOutgoingBody,
} from "@stdTypes/apiTypes";
import { EditorCanvas } from "@client/editor/canvas";
import { CollectionModal } from "@client/modal/collectionModal";
import { JsonEditorModal } from "@client/modal/jsonEditorModal";
import { getResolver } from "@client/utils";

export class Toolbar {
  constructor(
    container: HTMLDivElement,
    communications: IEditorCommunications
  ) {
    const testBtn = document.createElement("button");
    const loadBtn = document.createElement("button");
    const saveBtn = document.createElement("button");
    const newStageBtn = document.createElement("button");
    const stageSettingsBtn = document.createElement("button");
    loadBtn.className =
      saveBtn.className =
      testBtn.className =
      newStageBtn.className =
      stageSettingsBtn.className =
        "smsh-button";
    testBtn.onclick = this.playTest;
    loadBtn.onclick = this.loadStage;
    saveBtn.onclick = this.saveStage;
    stageSettingsBtn.onclick = this.configureMeta;
    newStageBtn.onclick = this.createNewStage;
    testBtn.innerText = "run";
    loadBtn.innerText = "load";
    saveBtn.innerText = "save";
    newStageBtn.innerText = "new";
    stageSettingsBtn.innerText = "settings";
    this.communications = communications;
    container.append(testBtn, loadBtn, saveBtn, newStageBtn, stageSettingsBtn);
  }

  private communications: IEditorCommunications;
  private meta: Omit<LayoutMetaExt, "extra"> = {
    gridSize: 32,
    stageName: "",
    stageSystemName: "",
    author: "",
    timeLimit: 180,
  };

  saveStage = async () => {
    if (!this.communications.canvas)
      return this.communications.toast.notify("no stage loaded", "danger");
    const extra = this.communications.canvas.extractStageMetaExtra();
    const layoutData = this.communications.canvas.extractLayoutData();
    const payload: IEditorUploadIncomingBody = {
      meta: btoa(JSON.stringify({ ...this.meta, extra })),
      layoutData: btoa(layoutData),
    };
    const res = await fetch(
      `http://${window.location.hostname}:5900/editor/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    this.communications.toast.notify(
      res.ok ? "staged saved" : "failed to save",
      res.ok ? "info" : "danger"
    );
  };
  playTest = async () => {
    if (!this.communications.canvas)
      return this.communications.toast.notify("no stage loaded", "danger");
    const extra = this.communications.canvas.extractStageMetaExtra();
    const layoutData = this.communications.canvas.extractLayoutData();
    const meta: LayoutMetaExt = {
      ...this.meta,
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
    const stageNames = (await fetch(
      `http://${window.location.hostname}:5900/editor/stageNames`
    ).then((res) => res.json())) as string[];

    const { promise, resolve } = getResolver();

    let stageName: string;
    const onClick = (data: { stageName: string }) => {
      stageName = data.stageName;
      resolve();
    };

    const modal = new CollectionModal<{ stageName: string }>(
      document.querySelector(".modal-container"),
      this.communications.focusManager,
      stageNames.map((stageName) => ({
        contents: stageName,
        data: { stageName: stageName },
        onClick,
      }))
    );
    modal.show();
    await promise;
    modal.destructor();

    if (!stageName) return;

    this.communications.statusBar.stageName.innerText = stageName;

    const layoutText = await fetch(
      `http://${window.location.hostname}:5900/editor/load/layout/${stageName}`
    ).then((res) => res.text());
    const layout = atob(layoutText);
    const meta = JSON.parse(
      atob(
        await fetch(
          `http://${window.location.hostname}:5900/editor/load/meta/${stageName}`
        ).then((res) => res.text())
      )
    );
    const { extra, ...restMeta } = meta;
    this.meta = restMeta;

    this.communications.canvas?.destructor();
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
  createNewStage = async () => {
    const { promise, resolve } = getResolver();

    this.meta = {
      gridSize: 32,
      stageName: "new",
      stageSystemName: "new",
      author: "",
      timeLimit: 180,
    };

    this.communications.statusBar.stageName.innerText =
      this.meta.stageSystemName;

    const obj = { ref: { width: 50, height: 30 } };
    const modal = new JsonEditorModal(
      document.querySelector(".modal-container"),
      this.communications.focusManager,
      this.communications.toast,
      obj,
      resolve
    );
    modal.show();

    await promise;
    const { width, height } = obj.ref;

    this.communications.canvas?.destructor();
    const canvas = new EditorCanvas(
      document.querySelector(".editor__workplace__canvas-container"),
      { width, height, communications: this.communications }
    );
    this.communications.canvas = canvas;
    this.communications.focusManager.register(canvas);
    this.communications.focusManager.setFocus(canvas.getFocusTag());
  };
  configureMeta = async () => {
    const { promise, resolve } = getResolver();

    const obj = { ref: this.meta };
    const modal = new JsonEditorModal(
      document.querySelector(".modal-container"),
      this.communications.focusManager,
      this.communications.toast,
      obj,
      resolve
    );
    modal.show();

    await promise;
    this.meta = obj.ref;
    this.communications.statusBar.stageName.innerText =
      this.meta.stageSystemName;
  };
}
