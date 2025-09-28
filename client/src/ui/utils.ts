import { iconRoute } from "@client/routes";

export const makeIconLink = (
  iconBasename: string,
  url: string,
  blank?: boolean
) => {
  const d = document;
  const a = d.createElement("a");
  a.href = url;
  blank && (a.target = "_blank");
  const img = d.createElement("img");
  img.setAttribute("src", `${iconRoute}${iconBasename}`);
  img.setAttribute("width", "32px");
  a.appendChild(img);
  return a;
};

export const makeIconButton = (iconBasename: string, onClick: () => void) => {
  const d = document;
  const img = d.createElement("img");
  img.className = "smsh-button";
  img.setAttribute("src", `${iconRoute}${iconBasename}`);
  img.onclick = onClick;
  return img;
};
