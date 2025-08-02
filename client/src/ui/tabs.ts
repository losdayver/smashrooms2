interface ITabProps<Keys extends string[]> {
  labels: Keys;
}

interface ITab {
  label: string;
  tabRef: HTMLDivElement;
  contentsRef: HTMLDivElement;
}

export class Tabs<Keys extends string[]> {
  constructor(container: HTMLDivElement, props: ITabProps<Keys>) {
    this.mainDiv = document.createElement("div");
    this.mainDiv.className = "smsh-tabs";

    this.tabsContainer = document.createElement("div");
    this.tabsContainer.className = "smsh-tabs__tabs-container";

    this.contentsContainer = document.createElement("div");
    this.contentsContainer.className = "smsh-tabs__contents-container";

    props.labels.forEach((label) => {
      const tab = document.createElement("div");
      tab.classList.add("smsh-tabs__tab", "smsh-button");
      tab.innerText = label;
      tab.onclick = () => this.selectTab(label);
      this.tabsContainer.appendChild(tab);

      const contents = document.createElement("div");
      contents.className = "smsh-tabs__contents";
      this.contentsContainer.appendChild(contents);

      this.tabStructure.push({
        label: label,
        tabRef: tab,
        contentsRef: contents,
      });
    });

    this.activeTab = this.tabStructure[0];

    this.mainDiv.append(this.tabsContainer, this.contentsContainer);
    this.selectTab(props.labels[0]);
    container.appendChild(this.mainDiv);
  }

  getTabs = () => this.tabStructure;
  getActiveTab = () => this.activeTab;

  private tabStructure: ITab[] = [];
  private tabsContainer: HTMLDivElement;
  private contentsContainer: HTMLDivElement;
  private mainDiv: HTMLDivElement;
  private activeTab: ITab;

  private selectTab = (label: string) => {
    const otherTabs = this.tabStructure.filter((el) => el.label != label);
    otherTabs.forEach((el) => {
      el.contentsRef.style.visibility = "hidden";
      el.tabRef.classList.remove("smsh-tabs__tab--active");
    });
    const activeTab = this.tabStructure.find((el) => el.label == label);
    this.activeTab = activeTab;
    this.activeTab.tabRef.classList.add("smsh-tabs__tab--active");
    this.activeTab.contentsRef.style.visibility = "visible";
  };
}
