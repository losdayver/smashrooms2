import { IScoreUpdateExt } from "@smshTypes/messages";
import {
  IConnectResponseMessageExt,
  IServerChatMessageExt,
  IServerNotificationExt,
} from "@stdTypes/messages";
import {
  AudioTrackEngine,
  AudioEventEngine,
  soundTrackMap,
} from "@client/audio/audioEngine";
import { Client } from "@client/client/client";
import { EaselManager } from "@client/easel/easelManager";
import { FocusManager } from "@client/focus/focusManager";
import { ScoreBoardModal } from "@client/modal/scoreboard";
import { Chat } from "@client/ui/chat";
import { Toast } from "@client/ui/toast";
import { pickRandom } from "@client/utils";
import { RegModal } from "@client/modal/regModal";
import { GameMenuModal } from "@client/modal/gameMenuModal";
import { defaultServerConfigObj, ServerConfig } from "@client/config/server";

export const gameLoader = async () => {
  const serverCfg = new ServerConfig();
  let wsURLPrefix: string;
  // TODO: what if I connect to different host?
  window.location.protocol === "https:"
    ? (wsURLPrefix = "wss")
    : (wsURLPrefix = "ws");
  const client = new Client(
    new URL(
      `${wsURLPrefix}://${serverCfg.getValue("host")}:${serverCfg.getValue("port")}`
    )
  );

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
    scoreBoardModal.updateLocalScore(data);
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
  new EaselManager(easel, client, audioEventEng);

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
