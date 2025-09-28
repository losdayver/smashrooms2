import { IServerSceneMetaMessageExt } from "@stdTypes/messages";
import { Client } from "@client/client/client";
import { makeIconButton } from "@client/ui/utils";
import {
  commitInfoToHtml,
  getLastGitHubCommitInfo,
} from "@client/versioning/utils";
import { Modal } from "@client/modal/modal";
import { iconRoute } from "@client/routes";

export class RegModal extends Modal {
  private onSubmit: (clientName: string) => void;
  private client: Client;
  private infoContainer: HTMLDivElement;
  private sceneMetaContainerIsInit: boolean = false;
  private form: HTMLFormElement;
  private formIsInit: boolean = false;
  private versionInfoContainer: HTMLDivElement;

  constructor(
    container: HTMLDivElement,
    onSubmit: (clientName: string) => void,
    client: Client
  ) {
    super(container, {
      title: "Enter game",
      width: 500,
      noCloseButton: true,
    });
    this.client = client;
    this.onSubmit = onSubmit;
    client.on("socketOpen", "index", () => {
      client.getSceneMeta();
    });

    client.on(
      "serverSceneMeta",
      "regModal",
      (data: IServerSceneMetaMessageExt) => {
        if (!this.sceneMetaContainerIsInit) this.initSceneMetaContainer();
        this.updateSceneMetaInfo(data);
        if (!this.formIsInit) this.initForm();
      }
    );

    // TODO: handle unsuccessful getSceneMetas on clicking reload button after ws server is down
    client.on("socketConnectionError", "regModal", () => {
      this.infoContainer.innerHTML = "";
      const errorImg = document.createElement("img");
      errorImg.src = `${iconRoute}refusal.png`;
      errorImg.width = 96;
      errorImg.alt = "Error icon";
      const errorMsg = document.createElement("p");
      errorMsg.innerText = "Connection refused!";
      this.infoContainer.append(errorImg, errorMsg);
    });
  }

  protected getContent = (): HTMLElement => {
    this.infoContainer = document.createElement("div");
    this.infoContainer.style.margin = "1.5em 1.5em 0 1.5em";
    this.infoContainer.style.display = "flex";
    this.infoContainer.style.flexFlow = "column";
    this.infoContainer.style.alignItems = "center";
    this.infoContainer.style.gap = "0.5em";
    this.versionInfoContainer = document.createElement("div");
    this.versionInfoContainer.classList.add("github-container");
    this.versionInfoContainer.style.textAlign = "center";
    this.form = document.createElement("form");

    this.initLoader();
    const content = document.createElement("div");
    content.append(this.infoContainer, this.form, this.versionInfoContainer);
    return content;
  };

  private initLoader = (): void => {
    const spinner = document.createElement("div");
    spinner.classList.add("spinner");
    const loadingMsg = document.createElement("p");
    loadingMsg.innerText = "Loading stage info...";
    loadingMsg.style.fontSize = "17px";
    this.infoContainer.append(spinner, loadingMsg);
  };

  private initForm = (): void => {
    const input = document.createElement("input");
    input.classList.add("smsh-input");
    input.type = "text";
    input.style.height = "40px";
    input.style.width = "100%";

    const label = document.createElement("label");
    label.append("Enter player name:", input);
    // TODO: spacing between label and input

    const submitBtn = document.createElement("input");
    submitBtn.classList.add("smsh-button");
    submitBtn.type = "submit";
    submitBtn.value = "Connect";
    submitBtn.style.height = "40px";

    this.form.append(label, submitBtn);
    this.form.addEventListener("submit", (event: SubmitEvent) => {
      event.preventDefault();
      this.onSubmit(input.value);
    });
    this.form.classList.add("smsh-form");
    this.form.style.display = "flex";
    this.form.style.justifyContent = "center";
    this.form.style.alignItems = "end";
    this.form.style.gap = "0.5em";
    this.formIsInit = true;
  };

  private initSceneMetaContainer = async (): Promise<void> => {
    const getP = (title: string, className: string) => {
      const p = document.createElement("p");
      const b = document.createElement("b");
      b.classList.add(className);
      b.innerText = "";
      p.append(title, ": ", b);
      p.style.textAlign = "center";
      return p;
    };

    this.infoContainer.innerHTML = "";
    this.infoContainer.style.display = "block";

    const reloadBtn = makeIconButton("reload.png", this.client.getSceneMeta);
    reloadBtn.style.position = "absolute";
    reloadBtn.style.top = "8";
    reloadBtn.style.left = "8";

    this.infoContainer.append(
      reloadBtn,
      getP("Stage name", "stage-name"),
      getP("Author", "stage-author"),
      getP("Players", "stage-players")
    );
    const versionInfo = await getLastGitHubCommitInfo();
    versionInfo &&
      (this.versionInfoContainer.innerHTML =
        "<b>Last github pull: </b>" + commitInfoToHtml(versionInfo));
    this.sceneMetaContainerIsInit = true;
  };

  private updateSceneMetaInfo = (data: IServerSceneMetaMessageExt): void => {
    (document.querySelector(".stage-name") as HTMLElement).innerText =
      data.stageName;
    (document.querySelector(".stage-author") as HTMLElement).innerText =
      data.stageAuthor;
    (
      document.querySelector(".stage-players") as HTMLElement
    ).innerText = `${data.currPlayerCount}/${data.maxPlayerCount}`;
  };
}
