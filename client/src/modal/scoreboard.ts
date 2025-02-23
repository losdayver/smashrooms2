import { IScoreUpdateExt } from "../../../smshTypes/messages";
import { FocusManager, IFocusable } from "../focus/focusManager.js";
import { Modal } from "./modal.js";

export class ScoreBoardModal extends Modal implements IFocusable {
  constructor(container: HTMLDivElement) {
    super(container, {
      title: "Controls",
      width: 700,
    });
    this.board = document.createElement("div");
  }
  private focusManager: FocusManager;

  private board: HTMLDivElement;
  private score: Record<string, { K: number; D: number }> = {};

  updateScore = (update: IScoreUpdateExt) => {
    if (update.unlist) {
      delete this.score[update.tag];
      this.constructBoard();
      return;
    }
    this.score[update.tag] ??= { K: 0, D: 0 };
    if (update.K) this.score[update.tag].K = update.K;
    if (update.D) this.score[update.tag].D = update.D;
    this.constructBoard();
  };

  private constructBoard = () => {
    // todo rebuild board markdown here
    this.board.innerText = JSON.stringify(this.score);
  };

  onClose = () => {
    this.focusManager.setFocus("client");
  };

  getFocusTag = () => "scoreboard";
  onFocused = this.show;
  onFocusReceiveKey: IFocusable["onFocusReceiveKey"] = (key, status) => {
    if (status == "down" && key == "back") this.hide();
  };
  onFocusRegistered = (focusManager: FocusManager) => {
    this.focusManager = focusManager;
  };

  protected getContent = () => {
    return this.board;
  };
}
