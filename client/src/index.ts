import { Client } from "./client/client.js";
import { EaselManager } from "./easel/easelManager.js";
import { Chat } from "./ui/chat.js";
import { Toast } from "./ui/toast.js";

const toast = new Toast(document.querySelector(".toast-container"), 2000);

const client = new Client("ws://127.0.0.1:5889");
client.onConnectHandlers.index = (status) => {
  if (status) {
    regModal.style.display = "none";
  }
};
client.onConnectHandlers.toast = (status) => {
  if (status) toast.notify("successfully connected!", "info");
  else toast.notify("failed to connect!", "warning");
};

const chat = new Chat(
  document.querySelector(".chat-container"),
  client.sendChatMessage
);

client.onChatEventHandlers.chat = chat.receiveMessage;

const easel = document.querySelector<HTMLDivElement>(".easel");
const easelManager = new EaselManager(easel, client);

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
