export interface ICollectionItem<T = any> {
  contents: string | HTMLElement;
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
    if (typeof item.contents == "string") domRef.innerText = item.contents;
    else domRef.append(item.contents);
    domRef.onclick = () => item.onClick?.(item.data);
    const domItem = { domRef, ...item };
    this.collection.push(domItem);
    this.collectionDiv.appendChild(domRef);
  };
  removeItem = (searchFunc: (item: ICollectionItem<T>) => boolean) => {
    const item = this.collection.find(searchFunc);
    this.collection = this.collection.filter((item1) => item1 != item);
    item?.domRef.remove();
  };
  selectItem = (searchFunc: (item: ICollectionItem<T>) => boolean) => {
    const item = this.collection.find(searchFunc);
    item?.domRef.classList.add("smsh-collection__item--selected");
  };
  unselectItem = (searchFunc: (item: ICollectionItem<T>) => boolean) => {
    const item = this.collection.find(searchFunc);
    item?.domRef.classList.remove("smsh-collection__item--selected");
  };
  unselectAll = () => {
    this.collection.forEach((item) =>
      item?.domRef.classList.remove("smsh-collection__item--selected")
    );
  };
  removeAll = () => {
    this.collection.forEach((item) => item.domRef.remove());
    this.collection = [];
  };
}
