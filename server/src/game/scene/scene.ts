import {
  ClientActionCodesExt,
  ClientActionStatusExt,
} from "../../../../types/messages";
import {
  IClientActionEvent,
  IDestroyControlledPropEvent,
  IDestroyPropEvent,
  IExternalEvent,
  IInternalEvent,
  IScene,
  ISceneSubscriber,
  ISceneTemplate,
  ISpawnControlledPropEvent,
  ISpawnPropEvent,
  PropID,
} from "./sceneTypes";
import { Mutex, severityLog } from "./../../utils";
import { propsMap } from "./props";
import { IControlled, IPositioned, IProp, PropBehaviours } from "./propTypes";

type ChunkedUpdateMap = Record<`${number}_${number}`, ChunkUpdate>;
type ChunkUpdate = {
  props: (IProp & PropBehaviours)[];
  /** prop ID followed by behaviour that was mutated */
  update: Record<PropID, Record<string, PropBehaviours>>;
  load: (IProp & PropBehaviours)[];
  delete: string[];
};

export class Scene implements IScene {
  eventHandler: ISceneSubscriber["handlerForSceneExternalEvents"];

  private chunkSize = 256;
  private propList: (IProp & PropBehaviours)[] = []; // todo wrap it up in mutex
  private internalEventQueueMutex = new Mutex<IInternalEvent[]>([]);
  private internalEventHandlerMap: Record<
    IInternalEvent["name"],
    (data: any) => void
  >;
  private $chunkedUpdates: ChunkedUpdateMap = {};

  private $appendToChunkedUpdates = (
    partialChunk: Partial<ChunkUpdate>,
    prop: IPositioned
  ) => {
    const coordID = `${Math.floor(
      prop.positioned.posX / this.chunkSize
    )}_${Math.floor(prop.positioned.posY / this.chunkSize)}`;

    if (!this.$chunkedUpdates[coordID]) this.$chunkedUpdates[coordID] = {};
    const chunk = this.$chunkedUpdates[coordID];
    this.$chunkedUpdates[coordID] = {
      props: (chunk?.props ?? []).concat(partialChunk.props ?? []),
      update: { ...(chunk?.update ?? {}), ...(partialChunk.update ?? {}) },
      load: (chunk?.load ?? []).concat(partialChunk.load ?? []),
      delete: (chunk?.delete ?? []).concat(partialChunk.delete ?? []),
    } satisfies ChunkUpdate;
  };

  private $generateExternalEventBatch = (
    clientID: string | "all",
    type: "currentState" | "everyUpdate" | "localUpdates"
  ) => {
    let batch: IExternalEvent = {};
    if (type == "currentState") {
      Object.values(this.$chunkedUpdates).forEach((chunkedUpdate) => {
        if (chunkedUpdate.props) {
          if (!batch.load) batch.load = [];
          chunkedUpdate.props.forEach((prop) => {
            if (!prop.drawable) return;
            const partialProp: Omit<IProp, "scene"> & PropBehaviours = {
              ID: prop.ID,
              drawable: prop.drawable,
              positioned: prop.positioned,
            };
            if (prop.nameTagged) partialProp.nameTagged = prop.nameTagged;
            batch.load.push(partialProp);
          });
        }
      });
    } else if (type == "everyUpdate") {
      const tempUpdate = {};
      const tempLoad = [];
      let tempDelete = [];
      // todo deleted props

      Object.values(this.$chunkedUpdates).forEach((chunkedUpdate) => {
        if (chunkedUpdate.update) {
          Object.entries(chunkedUpdate.update).forEach(([propID, update]) => {
            if (!update.positioned) return;
            tempUpdate[propID] = { positioned: update.positioned };
          });
        }

        if (chunkedUpdate.load) {
          chunkedUpdate.load.forEach((prop) => {
            if (!prop.drawable) return;
            const tempProp = {
              ID: prop.ID,
              drawable: prop.drawable,
              positioned: prop.positioned,
            } as IProp & PropBehaviours;
            if (prop.nameTagged)
              tempProp.nameTagged = { tag: prop.nameTagged.tag };
            tempLoad.push(tempProp);
          });
        }

        if (chunkedUpdate.delete)
          tempDelete = tempDelete.concat(chunkedUpdate.delete);
      });

      if (Object.keys(tempUpdate).length) batch.update = tempUpdate;
      if (tempLoad.length) batch.load = tempLoad;
      if (tempDelete.length) batch.delete = tempDelete;
    }
    if (Object.keys(batch).length) this.eventHandler(batch, clientID);
  };

  $isProcessingTick = false;
  tick = async () => {
    if (this.$isProcessingTick) return;
    this.$isProcessingTick = true;
    // load all props $chunkedUpdates
    this.$chunkedUpdates = {};
    this.propList.forEach((prop) => {
      if (prop.positioned)
        this.$appendToChunkedUpdates({ props: [prop] }, prop as IPositioned);
    });

    // do all the game logic here
    ("Hello World!");
    this.propList.forEach((prop) => {
      if (prop.onTick) prop.onTick();
    });

    // fire all internal even handlers
    if (this.internalEventQueueMutex.value.length) {
      const unlock = await this.internalEventQueueMutex.acquire();
      try {
        while (this.internalEventQueueMutex.value.length) {
          const event = this.internalEventQueueMutex.value.pop();
          this.internalEventHandlerMap[event.name]?.(event.data);
        }
      } finally {
        unlock();
      }
    }

    // todo this is inefficient
    this.$generateExternalEventBatch("all", "everyUpdate");
    this.$isProcessingTick = false;
  };

  private spawnPropHandler = (data: ISpawnPropEvent["data"]) => {
    const propType = propsMap[data.propName];
    if (propType) {
      const prop = new propType(this) as IProp & PropBehaviours;
      this.propList.unshift(prop);
      severityLog(`created new prop ${data.propName}`);
      if (prop.positioned)
        this.$appendToChunkedUpdates(
          { props: [prop], load: [prop] },
          prop as IPositioned
        );
    }
  };
  private spawnControlledPropHandler = (
    data: ISpawnControlledPropEvent["data"]
  ) => {
    const propType = propsMap[data.propName];
    if (propType) {
      const prop = new propsMap[data.propName](data.clientID, this) as IProp &
        PropBehaviours;
      if (data.nameTag) prop.nameTagged = { tag: data.nameTag };
      if (prop.controlled) {
        this.propList.unshift(prop);
        severityLog(
          `created new controlled prop ${data.propName} for ${data.clientID}`
        );
        this.$appendToChunkedUpdates(
          { props: [prop], load: [prop] },
          prop as IPositioned
        );
      }
    }
  };
  private destroyPropHandler = (data: IDestroyPropEvent["data"]) => {
    for (let i = 0; i < this.propList.length; i++) {
      if (this.propList[i].ID == data.ID) {
        this.$appendToChunkedUpdates(
          { delete: [data.ID] },
          this.propList[i] as IPositioned
        );
        this.propList.splice(i, 1);
        severityLog(`destroyed prop ${this.propList[i].ID}`);
        return;
      }
    }
  };
  private destroyControlledPropHandler = (
    data: IDestroyControlledPropEvent["data"]
  ) => {
    for (let i = 0; i < this.propList.length; i++) {
      if (
        (this.propList[i] as unknown as IControlled)?.controlled.clientID ==
        data.clientID
      ) {
        this.$appendToChunkedUpdates(
          { delete: [this.propList[i].ID] },
          this.propList[i] as IPositioned
        );
        this.propList.splice(i, 1);
        return;
      }
    }
  };
  private clientActionHandler = (data: IClientActionEvent["data"]) => {
    const prop = this.propList.find(
      (prop) => prop.controlled?.clientID == data.clientID
    ) as IProp & IControlled;
    prop.controlled.onReceive?.(data.code, data.status);
  };

  clientAction = async (
    clientID: string,
    code: ClientActionCodesExt,
    status?: ClientActionStatusExt
  ) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      this.internalEventQueueMutex.value.unshift({
        name: "clientAction",
        data: {
          clientID,
          code,
          status,
        },
      });
    } finally {
      unlock();
    }
  };
  connectAction = async (clientID: string, nameTag?: string) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      severityLog(`scene connected client ${clientID}`);
      const event = {
        name: "spawnControlledProp",
        data: {
          clientID,
          posX: 0,
          posY: 0,
          propName: "player",
        },
      } as ISpawnControlledPropEvent;
      if (nameTag) event.data.nameTag = nameTag;
      this.internalEventQueueMutex.value.unshift(event);
    } finally {
      unlock();
      this.$generateExternalEventBatch(clientID, "currentState");
    }
  };
  disconnectAction = async (clientID: string) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      this.internalEventQueueMutex.value.unshift({
        name: "destroyControlledProp",
        data: { clientID },
      });
    } finally {
      unlock();
    }
  };
  mutatePropBehaviourAction = (
    propOrID: (IProp & PropBehaviours) | string,
    behaviour: { name: string; newValue: PropBehaviours }
  ) => {
    const prop =
      typeof propOrID == "string"
        ? this.propList.find((prop) => prop.ID == propOrID)
        : propOrID;
    prop[behaviour.name] = behaviour.newValue;
    if (prop.positioned)
      this.$appendToChunkedUpdates(
        { update: { [prop.ID]: { [behaviour.name]: behaviour.newValue } } },
        prop as IPositioned
      );
  };

  makeSubscribe = (subscriber: ISceneSubscriber) => {
    this.eventHandler = subscriber.handlerForSceneExternalEvents;
  };

  loadTemplate = (template: ISceneTemplate) => {
    this.propList = [...template?.props];
  };

  constructor() {
    this.internalEventHandlerMap = {
      spawnControlledProp: this.spawnControlledPropHandler,
      spawnProp: this.spawnPropHandler,
      destroyProp: this.destroyPropHandler,
      destroyControlledProp: this.destroyControlledPropHandler,
      clientAction: this.clientActionHandler,
    };
  }
}
