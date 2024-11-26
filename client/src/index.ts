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
        const img = document.createElement("img");
        img.id = prop.ID;
        img.src = `img/props/${prop.drawable.animationCode}.png`;
        img.style.top = prop.positioned.posY;
        img.style.left = prop.positioned.posX;
        img.className = "prop-sprite";
        pivot.appendChild(img);
      }
    });
    if (data.update) {
      Object.entries(data.update)?.forEach(([propID, changes]: any) => {
        const el = document.getElementById(propID);
        if (!el) return;
        if (changes.positioned) {
          el.style.top = changes.positioned.posY;
          el.style.left = changes.positioned.posX;
        }
      });
    }
    data.delete?.forEach((propID: string) => {
      const el = document.getElementById(propID);
      if (!el) return;
      pivot.removeChild(el);
    });
  }
);

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
