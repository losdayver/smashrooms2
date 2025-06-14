import { IScoreUpdateExt } from "../../smshTypes/messages.js";
import {
  IConnectResponseMessageExt,
  IServerChatMessageExt,
  IServerNotificationExt,
} from "../../types/messages.js";
import {
  AudioTrackEngine,
  AudioEventEngine,
  soundTrackMap,
} from "./audio/audioEngine.js";
import { Client } from "./client/client.js";
import { EaselManager } from "./easel/easelManager.js";
import { FocusManager } from "./focus/focusManager.js";
import { ScoreBoardModal } from "./modal/scoreboard.js";
import { Chat } from "./ui/chat.js";
import { Toast } from "./ui/toast.js";
import { pickRandom } from "./utils.js";
import { RegModal } from "./modal/regModal.js";
import { GameMenuModal } from "./modal/gameMenuModal.js";

const initGameLayout = async () => {
  const client = new Client(`ws://${window.location.hostname}:5889`);

  const chat = new Chat(
    document.querySelector(".chat-container"),
    client.sendChatMessage
  );
  client.on("connRes", "main", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") {
      regModal.hide();
      client.getSceneMeta();
      focus.register(chat);
      audioTrackEng.playSound(pickRandom(playlist));
    }
  });
  client.on("serverChat", "chat", (data: IServerChatMessageExt) => {
    chat.receiveMessage(data.sender, data.message);
  });
  client.on("score", "self", (data: IScoreUpdateExt) => {
    scoreBoardModal.updateScore(data);
  });

  const audioTrackEng = new AudioTrackEngine();

  // todo let player build his own playlist
  const playlist: (keyof typeof soundTrackMap)[] = [
    "yeast soup",
    "bioluminescence",
    "ascend",
    "mycelium",
    "iceworld",
  ];
  audioTrackEng.on("onStartedSoundtrack", "toast", (name: string) => {
    toast.notify(audioTrackEng.getCurrentSoundTrackInfo(), "music");
  });
  audioTrackEng.on(
    "onEndedSoundtrack",
    "index",
    (name: keyof typeof soundTrackMap) => {
      let index = playlist.indexOf(name);
      index++;
      if (index >= playlist.length) index = 0;
      audioTrackEng.playSound(playlist[index]);
    }
  );

  const audioEventEng = new AudioEventEngine();

  const toast = new Toast(document.querySelector(".toast-container"));
  client.on("serverNotify", "toast", (data: IServerNotificationExt) =>
    toast.notify(data.message, data.type)
  );
  client.on("connRes", "toast", (data: IConnectResponseMessageExt) => {
    if (data.status != "allowed") {
      toast.notify("Failed to connect!", "warning");
      toast.notify(`Cause: ${data.cause}!`, "warning");
    }
  });

  const easel = document.querySelector<HTMLDivElement>(".easel");
  const easelManager = new EaselManager(easel, client, audioEventEng);

  const focus = new FocusManager();
  focus.register(client);
  client.on("connRes", "focus", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") focus.setFocus("client");
  });

  const menuModal = new GameMenuModal(
    document.querySelector<HTMLDivElement>(".modal-container"),
    audioTrackEng,
    audioEventEng
  );
  focus.register(menuModal);

  const scoreBoardModal = new ScoreBoardModal(
    document.querySelector<HTMLDivElement>(".modal-container"),
    client
  );
  focus.register(scoreBoardModal);

  const regModal = new RegModal(
    document.querySelector<HTMLDivElement>(".modal-container"),
    (clientName: string) => {
      if (clientName.trim()) client.connectByClientName(clientName);
    },
    client
  );
  regModal.show();
};

window.addEventListener(`contextmenu`, (e) => e.preventDefault());
initGameLayout();
