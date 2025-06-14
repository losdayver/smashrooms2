import { IServerSceneMetaMessageExt } from "../../../types/messages.js";
import { Client } from "../client/client.js";
import { makeIconButton } from "../utils.js";
import { commitInfoToHtml, getLastCommitInfo } from "../versioning/github.js";
import { Modal } from "./modal.js";

export class RegModal extends Modal {
  private onSubmit: (clientName: string) => void;
  private client: Client;
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
        this.updateServerInfo(data);
      }
    );
  }

  private infoContainer: HTMLDivElement;
  private gitHubInfoContainer: HTMLDivElement;

  protected getContent = () => {
    const label = document.createElement("label");

    const input = document.createElement("input");
    input.classList.add("smsh-input");
    input.type = "text";

    label.append("Enter player name:", input);

    const submit = document.createElement("input");
    submit.classList.add("smsh-button");
    submit.type = "submit";
    submit.value = "Connect";

    const form = document.createElement("form");

    this.infoContainer = document.createElement("div");
    this.gitHubInfoContainer = document.createElement("div");

    form.append(this.infoContainer, label, submit, this.gitHubInfoContainer);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onSubmit(input.value);
    });
    form.classList.add("shmsh-form");

    return form;
  };

  private updateServerInfo = async (data: IServerSceneMetaMessageExt) => {
    const d = document;
    const getP = (title: string, contents: any) => {
      const p = d.createElement("p");
      const b = d.createElement("b");
      b.innerText = contents ?? "";
      p.append(title, ": ", b);
      p.style.textAlign = "center";
      return p;
    };
    const reload = makeIconButton("reload.png", this.client.getSceneMeta);
    reload.style.position = "absolute";
    reload.style.top = "8";
    reload.style.left = "8";
    this.infoContainer.innerHTML = "";
    this.infoContainer.append(
      reload,
      getP("Stage name", data.stageName),
      getP("Author", data.stageAuthor),
      getP("Players", `${data.currPlayerCount}/${data.maxPlayerCount}`)
    );
    const gihubInfo = await getLastCommitInfo();
    gihubInfo &&
      (this.gitHubInfoContainer.innerHTML =
        "<b>Last github pull: </b>" + commitInfoToHtml(gihubInfo));
  };
}
