import { IScoreUpdateExt } from "@smshTypes/messages";
import { IStageChangeExt } from "@stdTypes/messages";
import { Client } from "@client/client/client";
import { FocusManager, IFocusable } from "@client/focus/focusManager";
import { Modal } from "@client/modal/modal";

export class ScoreBoardModal extends Modal implements IFocusable {
  constructor(container: HTMLDivElement, client: Client) {
    super(container, {
      title: "Leaderboard",
      noCloseButton: true,
      overlayStyle: {
        backdropFilter: "none",
      },
    });
    this.client = client;
    client.on("stageChange", "scoreboard", async (msg: IStageChangeExt) => {
      await this.updateGlobalScore();
      if (msg.status == "showScore") {
        this.allowHide = false;
        this.focusManager.setFocus("scoreboard"); // todo hide all the modals besides the scoreboard modal
      } else if (msg.status == "reloadStage") {
        this.allowHide = true;
        this.hide();
      }
    });
    this.board = document.createElement("div");
    this.board.style.display = "flex";
    this.board.style.flexDirection = "column";
    this.board.style.justifyContent = "center";
    this.board.style.alignItems = "center";
  }

  client: Client;
  private focusManager: FocusManager;
  private allowHide = true;
  private localScoreArray: ScoreObj[] = [];
  private globalScoreArray: { tag: string; kills: number }[] = [];

  private board: HTMLDivElement;

  updateLocalScore = (update: IScoreUpdateExt) => {
    if (update.unlist)
      this.localScoreArray = this.localScoreArray.filter(
        (element: ScoreObj) => element.N !== update.tag
      );
    else {
      let updateIndex: number = this.localScoreArray.findIndex(
        (element: ScoreObj) => element.N === update.tag
      );
      if (updateIndex === -1)
        updateIndex =
          this.localScoreArray.push({
            N: update.tag,
            K: 0,
            D: 0,
          }) - 1;
      if (update.K) this.localScoreArray[updateIndex].K = update.K;
      if (update.D) this.localScoreArray[updateIndex].D = update.D;
    }
    this.constructBoard();
  };
  updateGlobalScore = async () => {
    this.globalScoreArray = (await this.client.queryDBPromisified(
      "qTopScoresByTag",
      { limit: 10 }
    )) as { tag: string; kills: number }[];
    console.log(this.globalScoreArray);
    this.constructBoard();
  };

  private constructBoard = () => {
    this.board.innerHTML = "";
    this.constructLocalTable();
    this.constructGlobalTable();
  };
  private constructLocalTable = () => {
    this.localScoreArray.sort((a, b) => a.K - b.K);
    const wrapper = document.createElement("div");
    const header = document.createElement("h3");
    header.innerText = "Leaders";
    header.style.textAlign = "center";
    wrapper.appendChild(header);
    const table = document.createElement("table");
    table.className = "smsh-table";
    const tHead = document.createElement("thead");
    tHead.innerHTML = `<tr>
      <td>Rank</td>
      <td>Player name</td>
      <td>Kills</td>
      <td>Deaths</td>
    </tr>`;
    table.appendChild(tHead);

    const tBody = document.createElement("tbody");
    for (let i: number = 0; i < this.localScoreArray.length; i++) {
      const playerRow = document.createElement("tr");
      playerRow.innerHTML = `\
        <td>${i + 1}.</td>
        <td>${this.localScoreArray[i].N}</td>
        <td>${this.localScoreArray[i].K}</td>
        <td>${this.localScoreArray[i].D}</td>
      `;
      tBody.appendChild(playerRow);
    }
    table.appendChild(tBody);
    wrapper.appendChild(table);
    this.board.appendChild(wrapper);
  };
  private constructGlobalTable = () => {
    const wrapper = document.createElement("div");
    const header = document.createElement("h3");
    header.innerText = "Top players of all time";
    header.style.textAlign = "center";
    wrapper.appendChild(header);
    const table = document.createElement("table");
    table.className = "smsh-table";
    const tHead = document.createElement("thead");
    tHead.innerHTML = `<tr>
      <td>Rank</td>
      <td>Player name</td>
      <td>Kills</td>
    </tr>`;
    table.appendChild(tHead);

    const tBody = document.createElement("tbody");
    for (let i: number = 0; i < this.globalScoreArray.length; i++) {
      const playerRow = document.createElement("tr");
      playerRow.innerHTML = `\
        <td>${i + 1}.</td>
        <td>${this.globalScoreArray[i].tag}</td>
        <td>${this.globalScoreArray[i].kills}</td>
      `;
      tBody.appendChild(playerRow);
    }
    table.appendChild(tBody);
    wrapper.appendChild(table);
    this.board.appendChild(wrapper);
  };

  onClose = () => {
    this.focusManager.setFocus("client");
  };

  getFocusTag = () => "scoreboard";
  onFocused = () => {
    void this.updateGlobalScore();
    this.show();
  };
  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (key, status) => {
    if (
      this.allowHide &&
      ((status == "down" && key == "back") ||
        (status == "up" && key == "select"))
    )
      this.hide();
  };
  onFocusRegistered = (focusManager: FocusManager) => {
    this.focusManager = focusManager;
  };

  protected getContent = (): HTMLDivElement => {
    return this.board;
  };
}

type ScoreObj = {
  N?: string;
  K: number;
  D: number;
};
