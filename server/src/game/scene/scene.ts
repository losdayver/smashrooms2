import {
  IAnimatePropEvent,
  IClientActionEvent,
  IDestroyControlledPropEvent,
  IDestroyPropEvent,
  IExternalEventBatch,
  IInternalEvent,
  ILayoutTile,
  IScene,
  ISceneSubscriber,
  ISceneTemplate,
  ISpawnControlledPropEvent,
  ISpawnPropEvent,
} from "./sceneTypes";
import { doBenchmark, Mutex, pickRandom } from "./../../utils";
import { Prop } from "./prop";
import { IControlled, IPositioned, IProp, PropBehaviours } from "./propTypes";
import { IAnimationExt, PropIDExt } from "../../../../types/sceneTypes";
import { StageExt } from "../../../../types/stage";
import { ClientID } from "../commonTypes";
import {
  ISceneUpdatesMessageExt,
  IServerNotificationExt,
} from "../../../../types/messages";

type ChunkedUpdateMap = Record<`${number}_${number}`, ChunkUpdate>;
type ChunkUpdate = {
  props: (IProp & PropBehaviours)[];
  update: Record<PropIDExt, PropBehaviours>;
  load: (IProp & PropBehaviours)[];
  delete: string[];
  anim: IAnimationExt[];
};

export class Scene implements IScene {
  sendMessageToSubscriber: ISceneSubscriber["onReceiveMessageFromScene"];

  private chunkSize = 256;
  private propList: (IProp & PropBehaviours)[] = [];
  private internalEventQueueMutex = new Mutex<IInternalEvent[]>([]);
  private internalEventHandlerMap: Record<
    IInternalEvent["name"],
    (data: any) => void
  >;
  tickNum = 0;
  private stage: StageExt;
  private layoutLines: string[];

  private $chunkedUpdates: ChunkedUpdateMap = {};

  /** mutates $chunkedUpdates by mutating or creating new chunk with given properties
   * @param partialChunkUpdate contains changes that are to be applied during mutation
   * @param positionedProp is used to determine the coordinates of the chunk that needs
   * to be mutated or created
   */
  private $mutateChunkedUpdates = (
    partialChunkUpdate: Partial<ChunkUpdate>,
    positionedProp: IProp & IPositioned
  ) => {
    if (!positionedProp) return;

    const coordID = `${Math.floor(
      positionedProp.positioned.posX / this.chunkSize
    )}_${Math.floor(positionedProp.positioned.posY / this.chunkSize)}`;

    if (!this.$chunkedUpdates[coordID]) this.$chunkedUpdates[coordID] = {};
    const chunk = this.$chunkedUpdates[coordID] as ChunkUpdate;

    if (!chunk.load) chunk.load = [];
    if (!chunk.props) chunk.props = [];
    if (!chunk.delete) chunk.delete = [];
    if (!chunk.update) chunk.update = {};
    if (!chunk.anim) chunk.anim = [];

    let update = chunk.update;
    if (partialChunkUpdate.update) {
      update = { ...chunk.update };
      if (!update[positionedProp.ID]) update[positionedProp.ID] = {};
      for (const behaviourName in partialChunkUpdate.update[
        positionedProp.ID
      ]) {
        update[positionedProp.ID][behaviourName] = {
          ...(update[positionedProp.ID]?.[behaviourName] || {}),
          ...partialChunkUpdate.update[positionedProp.ID][behaviourName],
        };
      }
    }

    this.$chunkedUpdates[coordID] = {
      update,
      props: chunk.props.concat(partialChunkUpdate.props || []),
      load: chunk.load.concat(partialChunkUpdate.load || []),
      delete: chunk.delete.concat(partialChunkUpdate.delete || []),
      anim: chunk.anim.concat(partialChunkUpdate.anim || []),
    } satisfies Partial<ChunkUpdate>;
  };

  /** aggregates data from $chunkedUpdates into the event batch and calls subscriber's callback on it
   * @param clientID indicated who should get the batch. **all** stands for "every client gets data"
   * @param type defines the filter rule:
   * - currentState - send out the current state of the scene at this moment in time
   * - everyUpdate - send out only the changes at this moment in time
   * - localUpdates - send only local changes (in close proximity) unique to every client
   */
  private $generateExternalEventBatch = (
    clientID: ClientID | "all",
    type: "currentState" | "everyUpdate" | "localUpdates"
  ) => {
    let batch: IExternalEventBatch = {};
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
      let tempAnim = [];

      Object.values(this.$chunkedUpdates).forEach((chunkedUpdate) => {
        if (chunkedUpdate.update) {
          Object.entries(chunkedUpdate.update).forEach(([propID, update]) => {
            if (!tempUpdate[propID] && (update.drawable || update.positioned))
              tempUpdate[propID] = {};

            if (update.positioned)
              tempUpdate[propID].positioned = update.positioned;
            if (update.drawable) {
              tempUpdate[propID].drawable = update.drawable;
            }
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

        if (chunkedUpdate.anim) tempAnim = tempAnim.concat(chunkedUpdate.anim);
      });

      if (Object.keys(tempUpdate).length) batch.update = tempUpdate;
      if (tempLoad.length) batch.load = tempLoad;
      if (tempDelete.length) batch.delete = tempDelete;
      if (tempAnim.length) batch.anim = tempAnim;
    } else if (type == "localUpdates") throw new Error("not implemented");
    if (Object.keys(batch).length)
      this.sendMessageToSubscriber(
        { name: "scene", data: batch } satisfies ISceneUpdatesMessageExt,
        clientID
      );
  };

  $isProcessingTick = false;
  tick: IScene["tick"] = async () => {
    // const tickLoop = doBenchmark();
    if (this.$isProcessingTick) return;
    this.$isProcessingTick = true;
    this.$chunkedUpdates = {};
    this.propList.forEach((prop) => {
      if (prop.positioned)
        this.$mutateChunkedUpdates(
          { props: [prop] },
          prop as IProp & IPositioned
        );
    });

    // collision detection
    const checkedCollisions: PropIDExt[] = [];
    for (const [coord, chunk] of Object.entries(this.$chunkedUpdates)) {
      const [x, y] = coord.split("_").map(Number);
      const adjacentChunks: ChunkUpdate[] = [chunk];

      for (const [coordAdj, chunkAdj] of Object.entries(this.$chunkedUpdates)) {
        const [xAdj, yAdj] = coordAdj.split("_").map(Number);

        if (
          chunkAdj != chunk &&
          Math.abs(xAdj - x) <= 1 &&
          Math.abs(yAdj - y) <= 1
        )
          adjacentChunks.push(chunkAdj);
      }

      for (const prop of chunk.props) {
        if (prop.collidable) {
          for (const adjacentChunk of adjacentChunks) {
            for (const adjacentProp of adjacentChunk.props) {
              if (
                adjacentProp != prop &&
                adjacentProp.collidable &&
                !checkedCollisions.includes(adjacentProp.ID)
              ) {
                const left1 = prop.positioned.posX + prop.collidable.offsetX;
                const top1 = prop.positioned.posY + prop.collidable.offsetY;
                const width1 = prop.collidable.sizeX;
                const height1 = prop.collidable.sizeY;

                const left2 =
                  adjacentProp.positioned.posX +
                  adjacentProp.collidable.offsetX;
                const top2 =
                  adjacentProp.positioned.posY +
                  adjacentProp.collidable.offsetY;
                const width2 = adjacentProp.collidable.sizeX;
                const height2 = adjacentProp.collidable.sizeY;

                const isLeft = left1 + width1 <= left2;
                const isRight = left1 >= left2 + width2;
                const isAbove = top1 + height1 <= top2;
                const isBelow = top1 >= top2 + height2;

                if (!(isLeft || isRight || isAbove || isBelow)) {
                  prop.collidable.onCollide?.(adjacentProp);
                  adjacentProp.collidable.onCollide?.(prop);
                }
              }
            }
          }
          checkedCollisions.push(prop.ID);
        }
      }
    }

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

    this.propList.forEach((prop) => {
      if (prop.onTick) prop.onTick(this.tickNum);
    });

    this.$generateExternalEventBatch("all", "everyUpdate");
    this.tickNum++;
    this.$isProcessingTick = false;
  };

  private spawnPropHandler = (data: ISpawnPropEvent["data"]) => {
    const propType = this.propMap[data.propName];
    if (propType) {
      const prop = new propType(this) as Prop & PropBehaviours;
      if (data.behaviours) {
        for (const [key, val] of Object.entries(data.behaviours)) {
          if (prop[key]) prop[key] = { ...prop[key], ...val };
          else prop[key] = val;
        }
      }
      this.propList.unshift(prop);
      prop.onCreated?.(this.tickNum);
      if (prop.positioned)
        this.$mutateChunkedUpdates(
          { props: [prop], load: [prop] },
          prop as IProp & IPositioned
        );
    }
  };
  private spawnControlledPropHandler = (
    data: ISpawnControlledPropEvent["data"]
  ) => {
    const propType = this.propMap[data.propName];
    if (propType) {
      const prop = new propType(data.clientID, this);
      const spawners =
        this.propList.filter((prop) =>
          prop.spawner?.props.includes("player")
        ) ?? [];
      const spawner = pickRandom(spawners);
      if (spawner) prop.positioned = spawner.positioned;
      if (data.nameTag) prop.nameTagged = { tag: data.nameTag };
      if (prop.controlled) {
        this.propList.unshift(prop);
        prop.onCreated?.(this.tickNum);
        this.$mutateChunkedUpdates(
          { props: [prop], load: [prop] },
          prop as IProp & IPositioned
        );
        this.sendNotification(
          `${data.nameTag} ${
            data.type == "connected" ? "connected" : "is back"
          }!`,
          data.type
        );
      }
    }
  };
  private destroyPropHandler = (data: IDestroyPropEvent["data"]) => {
    for (let i = 0; i < this.propList.length; i++) {
      if (this.propList[i].ID == data.ID) {
        this.$mutateChunkedUpdates(
          { delete: [data.ID] },
          this.propList[i] as IProp & IPositioned
        );
        this.propList.splice(i, 1);
        return;
      }
    }
  };
  private destroyControlledPropHandler = (
    data: IDestroyControlledPropEvent["data"]
  ) => {
    for (let i = 0; i < this.propList.length; i++) {
      if (
        (this.propList[i] as unknown as IControlled).controlled?.clientID ==
        data.clientID
      ) {
        this.$mutateChunkedUpdates(
          { delete: [this.propList[i].ID] },
          this.propList[i] as IProp & IPositioned
        );
        this.propList.splice(i, 1);
        this.sendNotification(
          `${this.propList[i]?.nameTagged?.tag || "player"} disconnected.`,
          "disconnected"
        );
        return;
      }
    }
  };
  private clientActionHandler = (data: IClientActionEvent["data"]) => {
    const prop = this.propList.find(
      (prop) => prop.controlled?.clientID == data.clientID
    ) as IProp & IControlled;
    if (!prop) {
      if (data.code == "revive") {
        this.spawnControlledPropHandler({
          clientID: data.clientID,
          nameTag: data.nameTag,
          posX: 100,
          posY: 100,
          propName: "player",
          type: "revived",
        });
      }
    } else prop.controlled.onReceive(data.code, data.status);
  };
  private animatePropHandler = (data: IAnimatePropEvent["data"]) => {
    const prop = this.propList.find((prop) => prop.ID == data.ID) as IProp &
      IPositioned;
    this.$mutateChunkedUpdates({ anim: [data] }, prop);
  };

  sendNotification: IScene["sendNotification"] = (message, type?, target?) => {
    this.sendMessageToSubscriber(
      {
        name: "serverNotify",
        message,
        type,
      } satisfies IServerNotificationExt,
      target || "all"
    );
  };

  clientAction: IScene["clientAction"] = async (
    clientID,
    code,
    nameTag,
    status?
  ) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      this.internalEventQueueMutex.value.unshift({
        name: "clientAction",
        data: {
          clientID,
          code,
          nameTag,
          status,
        },
      });
    } finally {
      unlock();
    }
  };
  connectAction: IScene["connectAction"] = async (clientID, nameTag) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      const event = {
        name: "spawnControlledProp",
        data: {
          clientID,
          posX: 0,
          posY: 0,
          propName: "player",
          nameTag,
          type: "connected",
        },
      } satisfies ISpawnControlledPropEvent;
      if (nameTag) event.data.nameTag = nameTag;
      this.internalEventQueueMutex.value.unshift(event);
    } finally {
      unlock();
      this.$generateExternalEventBatch(clientID, "currentState");
    }
  };
  disconnectAction: IScene["disconnectAction"] = async (clientID) => {
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
  mutatePropBehaviourAction: IScene["mutatePropBehaviourAction"] = (
    propOrID,
    behaviour
  ) => {
    const prop =
      typeof propOrID == "string"
        ? this.propList.find((prop) => prop.ID == propOrID)
        : propOrID;
    prop[behaviour.name] = { ...prop[behaviour.name], ...behaviour.newValue };
    if (prop.positioned)
      this.$mutateChunkedUpdates(
        { update: { [prop.ID]: { [behaviour.name]: behaviour.newValue } } },
        prop as IProp & IPositioned
      );
  };
  spawnPropAction: IScene["spawnPropAction"] = async (
    propName,
    behaviours?
  ) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    const event = {
      name: "spawnProp",
      data: {
        propName,
        behaviours,
      },
    } satisfies ISpawnPropEvent;
    this.internalEventQueueMutex.value.unshift(event);
    unlock();
  };
  destroyPropAction: IScene["destroyPropAction"] = async (propID) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      this.internalEventQueueMutex.value.unshift({
        name: "destroyProp",
        data: { ID: propID },
      } satisfies IDestroyPropEvent);
    } finally {
      unlock();
    }
  };
  animatePropAction: IScene["animatePropAction"] = async (propID, name) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      this.internalEventQueueMutex.value.unshift({
        name: "animateProp",
        data: { ID: propID, name },
      } satisfies IAnimatePropEvent);
    } finally {
      unlock();
    }
  };

  getSceneMeta: IScene["getSceneMeta"] = () => {
    return {
      name: "serverSceneMeta",
      stageSystemName: this.stage?.meta.stageSystemName,
      gridSize: this.stage?.meta.gridSize,
    };
  };

  subscribe: IScene["subscribe"] = (subscriber) => {
    this.sendMessageToSubscriber = subscriber.onReceiveMessageFromScene;
  };

  loadTemplate = (template: ISceneTemplate) => {
    this.propList = [...template?.props];
  };

  getLayoutAt: IScene["getLayoutAt"] = (x, y) => {
    x = Math.floor(x / this.stage.meta.gridSize);
    y = Math.floor(y / this.stage.meta.gridSize);
    return this.getLayoutAtNormalized(x, y);
  };

  getLayoutAtNormalized: IScene["getLayoutAtNormalized"] = (x, y) => {
    try {
      const char = this.layoutLines[y][x];
      return {
        solidity: (
          layoutMap[char] || {
            solidity: "solid",
          }
        ).solidity,
      };
    } catch {}
    return { solidity: "ghost" };
  };

  checkLayoutCollision: IScene["checkLayoutCollision"] = (
    prop,
    ignoreSemi?: boolean
  ) => {
    const left = prop.positioned.posX + prop.collidable.offsetX;
    const right = left + prop.collidable.sizeX - 1;
    const leftN = Math.floor(left / this.stage.meta.gridSize);
    const rightN = Math.floor(right / this.stage.meta.gridSize);

    const top = prop.positioned.posY + prop.collidable.offsetY;
    const bottom = top + prop.collidable.sizeY - 1;
    const topN = Math.floor(top / this.stage.meta.gridSize);
    const bottomN = Math.floor(bottom / this.stage.meta.gridSize);

    for (let x = leftN; x <= rightN; x++) {
      for (let y = topN; y <= bottomN; y++) {
        const solidity = this.getLayoutAtNormalized(x, y).solidity;
        if (solidity == "solid" || (solidity == "semi" && !ignoreSemi))
          return true;
      }
    }
    return false;
  };

  propMap: Record<string, any>;

  constructor(
    propMap: Record<string, any>,
    stage?: StageExt,
    propFactoryMethod?: (scene: IScene, stage: StageExt) => void
  ) {
    this.stage = stage;
    this.layoutLines = this.stage.layoutData.split(/\r\n|\r|\n/);
    this.internalEventHandlerMap = {
      spawnControlledProp: this.spawnControlledPropHandler,
      spawnProp: this.spawnPropHandler,
      destroyProp: this.destroyPropHandler,
      destroyControlledProp: this.destroyControlledPropHandler,
      clientAction: this.clientActionHandler,
      animateProp: this.animatePropHandler,
    };
    this.propMap = propMap;
    if (stage) propFactoryMethod?.(this, stage);
  }
}

const layoutMap: Record<string, ILayoutTile> = {
  "=": {
    solidity: "semi",
  },
  " ": {
    solidity: "ghost",
  },
};
