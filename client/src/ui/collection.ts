export interface ICollectionItem<T = any> {
  title: string;
  data?: T;
  onClick?: (data: T) => void;
}

export interface ICollectionDomItem<T = any> extends ICollectionItem<T> {
  domRef: HTMLDivElement;
}

export class Collection<T = any> {
  constructor(container: HTMLDivElement, collection?: ICollectionItem<T>[]) {
    const collectionDiv = document.createElement("div");
    collectionDiv.className = "smsh-collection";
    this.collectionDiv = collectionDiv;
    container.appendChild(collectionDiv);
    this.collection = [];
    collection?.forEach(this.addItem);
  }

  private collectionDiv: HTMLDivElement;
  private collection: ICollectionDomItem<T>[];

  addItem = (item: ICollectionItem) => {
    const domRef = document.createElement("div");
    domRef.classList.add("smsh-collection__item", "smsh-button");
    domRef.innerText = item.title;
    domRef.onclick = () => item.onClick?.(item.data);
    const domItem = { domRef, ...item };
    this.collection.push(domItem);
    this.collectionDiv.appendChild(domRef);
  };
}
