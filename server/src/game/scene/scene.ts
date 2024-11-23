import { ClientActionCodes } from "../sockets/messageMeta";
import {
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
import { Prop, propsMap } from "./props";
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
      update: { ...(chunk?.update ?? {}), ...(partialChunk.update ?? []) },
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
    }
    this.eventHandler(batch, clientID);
  };

  tick = async () => {
    // load all props $chunkedUpdates
    this.$chunkedUpdates = {};
    this.propList.forEach((prop) => {
      if (prop.positioned)
        this.$appendToChunkedUpdates({ props: [prop] }, prop as IPositioned);
    });

    // do all the game logic here
    ("Hello World!");

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

    // transform $chunkedUpdates to list of external events and send them to the subscriber
  };

  private spawnPropHandler = (data: ISpawnPropEvent["data"]) => {
    const propType = propsMap[data.propName];
    if (propType) {
      const prop = new propType(this) as IProp & PropBehaviours;
      this.propList.unshift(prop);
      severityLog(`created new prop ${data.propName}`);
      if (prop.positioned)
        this.$appendToChunkedUpdates({ props: [prop] }, prop as IPositioned);
    }
  };
  private spawnControlledPropHandler = (
    data: ISpawnControlledPropEvent["data"]
  ) => {
    const propType = propsMap[data.propName];
    if (propType) {
      const prop = new propsMap[data.propName](data.clientID, this) as IProp &
        PropBehaviours;
      if (prop.controlled) {
        this.propList.unshift(prop);
        severityLog(
          `created new controlled prop ${data.propName} for ${data.clientID}`
        );
        this.$appendToChunkedUpdates({ props: [prop] }, prop as IPositioned);
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
        severityLog(
          `destroyed controlled prop with clientID ${
            (this.propList[i] as unknown as IControlled)?.controlled.clientID
          }`
        );
        this.$appendToChunkedUpdates(
          { delete: [this.propList[i].ID] },
          this.propList[i] as IPositioned
        );
        this.propList.splice(i, 1);
        return;
      }
    }
  };

  clientAction = (clientID: string, code: ClientActionCodes) => {
    severityLog(`client ${clientID} preformed action ${code}`);
  };
  connectAction = async (clientID: string) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      severityLog(`scene connected client ${clientID}`);
      this.internalEventQueueMutex.value.unshift({
        name: "spawnControlledProp",
        data: {
          clientID,
          posX: 0,
          posY: 0,
          propName: "player",
        },
      });
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
    };
  }
}
