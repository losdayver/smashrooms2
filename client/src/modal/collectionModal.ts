import { FocusManager } from "@client/focus/focusManager";
import { FocusableModal } from "@client/modal/modal";
import { Collection, ICollectionItem } from "@client/ui/collection";

export class CollectionModal<T = any> extends FocusableModal {
  constructor(
    container: HTMLDivElement,
    focusManager: FocusManager,
    collection: ICollectionItem<T>[]
  ) {
    super(container, {
      title: "Prop editor",
      width: 550,
      focusManager,
    });
    this.collection = collection;
  }

  private collection: ICollectionItem<T>[];
  protected getContent = () => {
    const content = document.createElement("div");
    new Collection(content, this.collection);
    return content;
  };
}
