import { editorLoader } from "@client/editor/editor";
import { gameLoader } from "@client/game";

const main = async () => {
  window.addEventListener(`contextmenu`, (e) => e.preventDefault());

  const route = window.location.pathname.slice(1) || "game";
  const loaderMap: Record<string, () => Promise<unknown> | unknown> = {
    "": gameLoader,
    game: gameLoader,
    editor: editorLoader,
    components: () => import("@client/ui/componentsLibrary"),
  } as const;
  const bodyText = await fetch("html/" + (route || "game") + ".html").then(
    (res) => res.text()
  );
  document.querySelector<"body">("body").innerHTML = bodyText;
  document.body.classList.add("loaded");
  await loaderMap[route]?.();
};

addEventListener("DOMContentLoaded", main);
