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
