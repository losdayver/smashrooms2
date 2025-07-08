export interface IPaletteColor {
  imgPath: string;
}

export abstract class Palette<Color extends IPaletteColor> {
  constructor(
    container: HTMLDivElement,
    colorMap: Record<string, Color>,
    baseImgRoute: string
  ) {
    this.colorMap = colorMap;
    this.palette = document.createElement("div");
    this.palette.classList.add("smsh-palette__container");

    let firstColorDiv: HTMLDivElement;
    let firstColor: string;

    for (const color of Object.keys(colorMap)) {
      const colorDiv = document.createElement("div");
      firstColorDiv ??= colorDiv;
      firstColor ??= color;

      colorDiv.classList.add("smsh-palette__container__color");
      colorDiv.onclick = () => this._selectColor(colorDiv, color);

      const img = document.createElement("img") as HTMLImageElement;
      img.src = `${baseImgRoute}${colorMap[color].imgPath}`;
      colorDiv.appendChild(img);
      this.palette.appendChild(colorDiv);
    }
    container.appendChild(this.palette);
    this._selectColor(firstColorDiv, firstColor);
  }

  private colorMap: Record<string, Color>;
  private _selectColor = (tileDiv: HTMLDivElement, color: string) => {
    if (this.selectedColorKey == color) return;
    Array.from(this.palette.children).forEach((child) =>
      child.classList.remove("smsh-palette__container__color--selected")
    );
    this.selectedColor == this.colorMap[color]
      ? tileDiv.classList.remove("smsh-palette__container__color--selected")
      : tileDiv.classList.add("smsh-palette__container__color--selected");
    this.selectedColor = this.colorMap[color];
    this.selectedColorKey = color;
  };
  private selectedColor: Color;
  private selectedColorKey: string;
  private palette: HTMLDivElement;

  getCurrentColor = () => this.selectedColor;
  getCurrentColorKey = () => this.selectedColorKey;
}
