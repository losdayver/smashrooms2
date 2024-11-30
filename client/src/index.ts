import { Client } from "./client/client.js";
import { EaselManager } from "./easel/easelManager.js";

const regModal = document.querySelector<HTMLDivElement>(".reg-modal");
const clientNameInput =
  regModal.querySelector<HTMLInputElement>(".client-name-input");
const regForm = regModal.querySelector("form");

const client = new Client("ws://127.0.0.1:5889");
const easel = document.querySelector<HTMLDivElement>(".easel");
const easelManager = new EaselManager(easel, client, (status) => {
  if (status) {
    regModal.style.display = "none";
  }
});

regForm.addEventListener("submit", (event) => {
  event.preventDefault();
  client.connectByClientName(clientNameInput.value);
});

document.addEventListener(
  "keydown",
  (e) => {
    console.log(e.code);
    if (e.code == "ArrowRight") client.sendInput("right");
    else if (e.code == "ArrowLeft") client.sendInput("left");
  },
  false
);
