import { EmptyModal } from "../modal/modal.js";
import { Toast } from "./toast.js";

const toastContainer = document.querySelector(
  ".library-toast-container"
) as HTMLDivElement;
const toastInput = document.querySelector(
  "#library-toast-notify-input"
) as HTMLInputElement;
const toastButton = document.querySelector(
  "#library-toast-notify-button"
) as HTMLButtonElement;

const toast = new Toast(toastContainer);
toastButton.onclick = () => {
  toast.notify(toastInput.value, "info");
};

const modalShowButton = document.querySelector(
  "#library-modal-show-button"
) as HTMLButtonElement;
const modalContainer = document.querySelector(
  "#library-modal-container"
) as HTMLDivElement;

const modal = new EmptyModal(modalContainer, {
  height: 700,
  width: 500,
  title: "settings",
});

modal.show();

modalShowButton.onclick = () => {
  modal.show();
};
