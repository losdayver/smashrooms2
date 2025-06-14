import { IScoreUpdateExt } from "@smshTypes/messages";
import { IStageChangeExt } from "@stdTypes/messages";
import { Client } from "@client/client/client";
import { FocusManager, IFocusable } from "@client/focus/focusManager";
import { Modal } from "@client/modal/modal";

export class ScoreBoardModal extends Modal implements IFocusable {
  constructor(container: HTMLDivElement, client: Client) {
    super(container, {
      title: "Score board",
      noCloseButton: true,
      overlayStyle: {
        backdropFilter: "none",
      },
    });
    client.on("stageChange", "scoreboard", (msg: IStageChangeExt) => {
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
    this.board.style.justifyContent = "center";
  }
  private focusManager: FocusManager;
  private allowHide = true;

  private board: HTMLDivElement;
  private scoreArray: ScoreObj[] = [];

  updateScore = (update: IScoreUpdateExt): void => {
    if (update.unlist) {
      this.scoreArray = this.scoreArray.filter(
        (element: ScoreObj) => element.N !== update.tag
      );
      this.constructBoard();
      return;
    }
    let updateIndex: number = this.scoreArray.findIndex(
      (element: ScoreObj) => element.N === update.tag
    );
    if (updateIndex === -1)
      updateIndex =
        this.scoreArray.push({
          N: update.tag,
          K: 0,
          D: 0,
        }) - 1;
    if (update.K) this.scoreArray[updateIndex].K = update.K;
    if (update.D) this.scoreArray[updateIndex].D = update.D;
    this.constructBoard();
  };

  private constructBoard = (): void => {
    this.sortScoreArrayDesc();
    this.constructTable();
  };

  private sortScoreArrayDesc = (): void => {
    this.scoreArray.sort((a, b) => (a.K > b.K ? -1 : 1));
  };

  private constructTable = (): void => {
    this.board.innerHTML = "";
    const scoreTable = document.createElement("table");
    scoreTable.className = "smsh-table";
    const tHead = document.createElement("thead");
    tHead.innerHTML = `<tr>
      <td>Rank</td>
      <td>Player name</td>
      <td>Kills</td>
      <td>Deaths</td>
      <td>Suicides</td>
      <td>Ping</td>
    </tr>`;
    scoreTable.appendChild(tHead);

    const tBody = document.createElement("tbody");
    for (let i: number = 0; i < this.scoreArray.length; i++) {
      const playerRow = document.createElement("tr");
      playerRow.innerHTML = `\
        <td>${i + 1}.</td>
        <td>${this.scoreArray[i].N}</td>
        <td>${this.scoreArray[i].K}</td>
        <td>${this.scoreArray[i].D}</td>
        <td>N/A</td>
        <td>N/A</td>
      `;
      tBody.appendChild(playerRow);
    }
    scoreTable.appendChild(tBody);

    this.board.appendChild(scoreTable);
  };

  onClose = () => {
    this.focusManager.setFocus("client");
  };

  getFocusTag = () => "scoreboard";
  onFocused = this.show;
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
