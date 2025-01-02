import {
  IConnectResponseMessageExt,
  IServerChatMessageExt,
  IServerNotificationExt,
  IServerSceneMetaMessageExt,
} from "../../types/messages";
import { StageExt } from "../../types/stage";
import { AudioManager } from "./audio/audioManager.js";
import { Client } from "./client/client.js";
import { EaselManager } from "./easel/easelManager.js";
import { FocusManager } from "./focus/focusManager.js";
import { Modal } from "./modal/modal.js";
import { stagesRoute } from "./routes.js";
import { Chat } from "./ui/chat.js";
import { Toast } from "./ui/toast.js";

export class RegModal extends Modal {
  private onSubmit: (clientName: string) => void;
  constructor(
    container: HTMLDivElement,
    onSubmit: (clientName: string) => void
  ) {
    super(container, {
      title: "Enter game",
      width: 500,
      noCloseButton: true,
    });
    this.onSubmit = onSubmit;
  }
  protected getContent = () => {
    const label = document.createElement("label");

    const input = document.createElement("input");
    input.classList.add("smsh-input");
    input.type = "text";

    label.append("Enter player name:", input);

    const submit = document.createElement("input");
    submit.classList.add("smsh-button");
    submit.type = "submit";

    const form = document.createElement("form");

    form.append(label, submit);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onSubmit(input.value);
    });
    form.classList.add("shmsh-form");

    return form;
  };
}

const tempTopLevelFunction = async () => {
  // todo this function is certified spaghetti fest. Needs some kind of architecture pattern
  const client = new Client(`ws://${window.location.hostname}:5889`);

  const chat = new Chat(
    document.querySelector(".chat-container"),
    client.sendChatMessage
  );

  client.on("connRes", "main", (data: IConnectResponseMessageExt) => {
    if (data.status == "allowed") regModal.hide();
    client.getSceneMeta();
    focus.register(chat);
    audio.startSoundtrack("iceworld");
  });

  const audio = new AudioManager();
  audio.on("onStartedSoundtrack", "toast", (data) => {
    toast.notify(`smsh2 OST — ${data.name}`, "music");
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

  const regModal = new RegModal(
    document.querySelector<HTMLDivElement>(".modal-container"),
    (clientName: string) => {
      client.connectByClientName(clientName);
    }
  );
  regModal.show();

  const focus = new FocusManager();
  focus.register(client);
  focus.setFocus("client");
};

tempTopLevelFunction();
