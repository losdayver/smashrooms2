import { Client } from "./client/client.js";

const regModal = document.querySelector<HTMLDivElement>(".reg-modal");
const clientNameInput =
  regModal.querySelector<HTMLInputElement>(".client-name-input");
const regForm = regModal.querySelector("form");

const pivot = document.querySelector<HTMLDivElement>(".easel .easel-pivot");

const client = new Client("ws://127.0.0.1:5889");
client.init(
  (status) => {
    if (status) {
      regModal.style.display = "none";
    }
  },
  (data) => {
    data.load?.forEach((prop: any) => {
      if (prop.drawable) {
        pivot.appendChild(
          Object.assign(document.createElement("img"), {
            class: "prop-sprite",
            src: "img/props/crate.png",
            position: "fixed",
            left: prop.positioned.posX,
            top: prop.positioned.posY,
          })
        );
      }
    });
  }
);

regForm.addEventListener("submit", (event) => {
  event.preventDefault();
  client.connectByClientName(clientNameInput.value);
});
