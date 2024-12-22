import {
  IConnectResponseMessageExt,
  IServerChatMessageExt,
  IServerNotificationExt,
  IServerSceneMetaMessageExt,
} from "../../types/messages";
import { StageExt } from "../../types/stage";
import { Client } from "./client/client.js";
import { EaselManager } from "./easel/easelManager.js";
import { stagesRoute } from "./routes.js";
import { Chat } from "./ui/chat.js";
import { Toast } from "./ui/toast.js";

const tempTopLevelFunction = async () => {
  // todo this function is certified spaghetti fest. Needs some kind of architecture pattern
  const client = new Client(`ws://${window.location.hostname}:5889`);

  client.on("connRes", "main", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") regModal.style.display = "none";
    client.getSceneMeta();
  });

  const toast = new Toast(document.querySelector(".toast-container"));
  client.on("serverNotify", "toast", (data: IServerNotificationExt) =>
    toast.notify(data.message, data.type)
  );
  client.on("connRes", "toast", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed")
      toast.notify("successfully connected!", "info");
    else toast.notify("failed to connect!", "warning");
  });

  const chat = new Chat(
    document.querySelector(".chat-container"),
    client.sendChatMessage
  );

  client.on("serverChat", "chat", (data: IServerChatMessageExt) => {
    chat.receiveMessage(data.sender, data.message);
  });

  const easel = document.querySelector<HTMLDivElement>(".easel");
  const easelManager = new EaselManager(easel, client);

  client.on(
    "serverSceneMeta",
    "easel",
    async (data: IServerSceneMetaMessageExt) => {
      const layoutString = (await fetch(
        `${stagesRoute}${data.stageSystemName}/${data.stageSystemName}.layout`
      )
        .then((data) => data)
        .then((data) => data.text())) as string;
      const layoutMeta = (await fetch(
        `${stagesRoute}${data.stageSystemName}/${data.stageSystemName}.meta.json`
      )
        .then((data) => data)
        .then((data) => data.text())) as StageExt["meta"];
      const stage: StageExt = {
        layoutData: layoutString,
        meta: layoutMeta,
      };

      easelManager.constructStage(stage);
    }
  );

  const regModal = document.querySelector<HTMLDivElement>(".reg-modal");
  const clientNameInput =
    regModal.querySelector<HTMLInputElement>(".client-name-input");
  const regForm = regModal.querySelector("form");
  regForm.addEventListener("submit", (event) => {
    event.preventDefault();
    client.connectByClientName(clientNameInput.value);
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.repeat) return;
      const status = "pressed";
      if (e.code == "ArrowRight") client.sendInput("right", status);
      else if (e.code == "ArrowLeft") client.sendInput("left", status);
      if (e.code == "ArrowUp") client.sendInput("jump", status);
      else if (e.code == "ArrowDown") client.sendInput("duck", status);

      if (e.code == "Space") client.sendInput("fire", status);
    },
    false
  );

  document.addEventListener(
    "keyup",
    (e) => {
      if (e.repeat) return;
      const status = "released";
      if (e.code == "ArrowRight") client.sendInput("right", status);
      else if (e.code == "ArrowLeft") client.sendInput("left", status);
      if (e.code == "ArrowUp") client.sendInput("jump", status);
      else if (e.code == "ArrowDown") client.sendInput("duck", status);
    },
    false
  );
};

tempTopLevelFunction();
