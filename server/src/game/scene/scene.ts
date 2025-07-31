import {
  ExternalLoadChunk,
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
  IStageLoader,
  Scheduler,
} from "@server/game/scene/sceneTypes";
import {
  doBenchmark,
  instanceOfCheck,
  Mutex,
  pickRandom,
  sleep,
} from "@server/utils";
import { Prop } from "@server/game/scene/prop";
import { IControlled, PropBehaviours } from "@server/game/scene/propTypes";
import {
  IAnimationExt,
  INameTaggedExt,
  IPositionedExt,
  ITileSymbols,
  PropIDExt,
} from "@stdTypes/sceneTypes";
import { StageExt } from "@stdTypes/stage";
import { ClientID, IDestructible } from "@server/game/commonTypes";
import {
  IServerNotificationExt,
  ISoundMessageExt,
  IStageChangeExt,
} from "@stdTypes/messages";
import { DBQuerier } from "@server/db/dbQuerier";

type ChunkedUpdateMap = Record<`${number}_${number}`, ChunkUpdate>;
type ChunkUpdate = {
  props: (Prop & PropBehaviours)[];
  update: Record<PropIDExt, PropBehaviours>;
  load: (Prop & PropBehaviours)[];
  delete: string[];
  anim: IAnimationExt[];
};

export class Scene implements IScene {
  sendMessageToSubscriber: ISceneSubscriber["onReceiveMessageFromScene"];
  scheduler: Scheduler;
  querier: DBQuerier;

  private chunkSize: number;
  private propList: (Prop & PropBehaviours)[];
  private internalEventQueueMutex: Mutex<IInternalEvent[]>;
  private tickMutex: Mutex<number>;
  private internalEventHandlerMap: Record<
    IInternalEvent["name"],
    (data: any) => void
  >;
  tickNum: number;
  private stage: StageExt;
  private stageNames: string[];
  private stageLoader: IStageLoader;
  private stageTimerID: NodeJS.Timeout;
  private layoutLines: string[];
  private propFactoryMethod: (scene: IScene, stage: StageExt) => void;
  private $preventTick = false;

  private $chunkedUpdates: ChunkedUpdateMap;

  private initState = () => {
    this.chunkSize = 256;
    this.propList = [];
    this.internalEventQueueMutex = new Mutex<IInternalEvent[]>([]);
    this.tickNum = 0;
    this.stage = undefined;
    this.layoutLines = undefined;
    this.$chunkedUpdates = {};
    this.stageTimerID = undefined;
    this.$preventTick = false;
    this.tickMutex = new Mutex(1);
  };

  loadStage = (name: string) => {
    if (!name) return;
    this.stage = this.stageLoader.load(name);
    this.layoutLines = this.stage.layoutData.split(/\r\n|\r|\n/);
    this.propFactoryMethod?.(this, this.stage);
    this.scheduler?.init(this, this.stage);
    if (this.stage.meta.timeLimit)
      this.stageTimerID = setTimeout(
        this.onStageChange,
        this.stage.meta.timeLimit * 1000
      );
  };

  private onStageChange = async () => {
    this.sendArbitraryMessage(
      {
        name: "stageChange",
        status: "showScore",
      } satisfies IStageChangeExt,
      "all"
    );
    this.$preventTick = true;
    const unlock = await this.tickMutex.acquire();
    let stageNameIndex: number = 0;
    if (this.stage)
      stageNameIndex =
        this.stageNames.indexOf(this.stage.meta.stageSystemName) + 1;
    await sleep(5000);
    this.initState();
    this.loadStage(this.stageNames[stageNameIndex % this.stageNames.length]);
    unlock();
    this.sendArbitraryMessage(
      {
        name: "stageChange",
        status: "reloadStage",
      } satisfies IStageChangeExt,
      "all"
    );
  };

  /** mutates $chunkedUpdates by mutating or creating new chunk with given properties
   * @param partialChunkUpdate contains changes that are to be applied during mutation
   * @param positionedProp is used to determine the coordinates of the chunk that needs
   * to be mutated or created
   */
  private $mutateChunkedUpdates = (
    partialChunkUpdate: Partial<ChunkUpdate>,
    positionedProp: Prop & IPositionedExt
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
            const partialProp: ExternalLoadChunk = {
              ID: prop.ID,
              drawable: prop.drawable,
              positioned: prop.positioned,
              $isDestroyed: prop.$isDestroyed,
            };
            if (prop.nameTagged) partialProp.nameTagged = prop.nameTagged;
            if (prop.damageable) partialProp.damageable = prop.damageable;
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
            if (
              !tempUpdate[propID] &&
              (update.drawable || update.positioned || update.damageable)
            )
              tempUpdate[propID] = {};

            if (update.positioned)
              tempUpdate[propID].positioned = update.positioned;
            if (update.drawable) tempUpdate[propID].drawable = update.drawable;
            if (update.damageable)
              tempUpdate[propID].damageable = update.damageable;
          });
        }

        if (chunkedUpdate.load) {
          chunkedUpdate.load.forEach((prop) => {
            if (!prop.drawable) return;
            const tempProp = {
              ID: prop.ID,
              drawable: prop.drawable,
              positioned: prop.positioned,
            } as Prop & PropBehaviours;
            if (prop.nameTagged) tempProp.nameTagged = prop.nameTagged;
            if (prop.nameTagged) tempProp.damageable = prop.damageable;
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
      this.sendMessageToSubscriber({ name: "scene", data: batch }, clientID);
  };

  $isProcessingTick = false;
  tick: IScene["tick"] = async () => {
    if (this.$preventTick) return;
    const unlock = await this.tickMutex.acquire();
    this.scheduler?.onTick(this.tickNum);

    // const tickLoop = doBenchmark();
    if (this.$isProcessingTick) return;
    this.$isProcessingTick = true;
    this.$chunkedUpdates = {};
    this.propList.forEach((prop) => {
      if (prop.positioned)
        this.$mutateChunkedUpdates(
          { props: [prop] },
          prop as Prop & IPositionedExt
        );
    });

    // collision detection
    const checkedCollisions = new Set<PropIDExt>();
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
                adjacentProp == prop ||
                !adjacentProp.collidable ||
                prop.$isDestroyed ||
                adjacentProp.$isDestroyed
              )
                continue;

              const whitelistCheck =
                (!adjacentProp.collidable.whitelist ||
                  adjacentProp.collidable.whitelist.some(
                    instanceOfCheck(prop)
                  )) &&
                (!prop.collidable.whitelist ||
                  prop.collidable.whitelist.some(
                    instanceOfCheck(adjacentProp)
                  ));

              const colGroupCheck =
                (prop.collidable.colGroup == adjacentProp.collidable.colGroup &&
                  prop.collidable.colGroup == null) ||
                prop.collidable.colGroup != adjacentProp.collidable.colGroup ||
                adjacentProp.collidable.colGroupIgnoreList?.some(
                  instanceOfCheck(prop)
                ) ||
                prop.collidable.colGroupIgnoreList?.some(
                  instanceOfCheck(adjacentProp)
                );

              if (
                colGroupCheck &&
                whitelistCheck &&
                !checkedCollisions.has(adjacentProp.ID)
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
          checkedCollisions.add(prop.ID);
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

    unlock();
  };

  produceSound: IScene["produceSound"] = (sound) => {
    this.sendMessageToSubscriber(
      { name: "sound", sound } satisfies ISoundMessageExt,
      "all"
    );
  };

  sendArbitraryMessage: IScene["sendArbitraryMessage"] = (message, target) => {
    this.sendMessageToSubscriber(message, target);
  };

  getPropByID: IScene["getPropByID"] = (ID) =>
    this.propList.find((prop) => prop.ID == ID);

  queryProp: IScene["queryProp"] = (queryFunc) => this.propList.find(queryFunc);

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
          prop as Prop & IPositionedExt
        );
    }
  };

  private spawnControlledPropHandler = (
    data: ISpawnControlledPropEvent["data"]
  ) => {
    const propType = this.propMap[data.propName];
    if (propType) {
      const prop = new propType(data.clientID, this) as Prop &
        IControlled &
        IPositionedExt &
        INameTaggedExt;
      const spawners =
        this.propList.filter((prop) =>
          prop.spawner?.props.includes("player")
        ) ?? [];
      const spawner = pickRandom(spawners);
      if (spawner) prop.positioned = spawner.positioned;
      if (data.nameTag) prop.nameTagged = { tag: data.nameTag };
      if (prop.controlled) {
        this.propList.unshift(prop);
        prop.onCreated?.(this.tickNum, data.type);
        this.$mutateChunkedUpdates(
          { props: [prop], load: [prop] },
          prop as Prop & IPositionedExt
        );
        if (data.type != "reviveSilent")
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
      const prop = this.propList[i];
      if (prop.ID == data.ID) {
        this.$mutateChunkedUpdates(
          { delete: [data.ID] },
          prop as Prop & IPositionedExt
        );
        prop.hasMaster?.onDestroySlave?.();
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
        this.propList[i].onDestroyed("disconnect");
        this.$mutateChunkedUpdates(
          { delete: [this.propList[i].ID] },
          this.propList[i] as Prop & IPositionedExt
        );
        this.propList.splice(i, 1);
        return;
      }
    }
  };

  private clientActionHandler = (data: IClientActionEvent["data"]) => {
    const prop = this.propList.find(
      (prop) => prop.controlled?.clientID == data.clientID
    ) as Prop & IControlled;
    if (!prop) {
      if (["revive", "reviveSilent"].includes(data.code)) {
        this.spawnControlledPropHandler({
          clientID: data.clientID,
          nameTag: data.nameTag,
          posX: 100,
          posY: 100,
          propName: "player",
          type: data.code as ISpawnControlledPropEvent["data"]["type"],
        });
        if (data.code == "revive") this.produceSound("revive");
      }
    } else prop.controlled.onReceive(data.code, data.status);
  };
  private animatePropHandler = (data: IAnimatePropEvent["data"]) => {
    const prop = this.propList.find((prop) => prop.ID == data.ID) as Prop &
      IPositionedExt;
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
      this.produceSound("clientConnect");
    } finally {
      unlock();
      this.$generateExternalEventBatch(clientID, "currentState");
    }
  };

  disconnectAction: IScene["disconnectAction"] = async (clientID) => {
    const unlock = await this.internalEventQueueMutex.acquire();
    const prop = this.queryProp(
      (prop) => (prop as Prop & IControlled)?.controlled?.clientID == clientID
    ) as Prop & INameTaggedExt;
    if (prop) prop.$isDestroyed = true;
    try {
      this.sendNotification(
        `${prop?.nameTagged?.tag || "player"} disconnected.`,
        "disconnected"
      );
      this.internalEventQueueMutex.value.unshift({
        name: "destroyControlledProp",
        data: { clientID },
      });
      this.produceSound("clientConnect");
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
        prop as Prop & IPositionedExt
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
      const prop = this.getPropByID(propID);
      if (prop) prop.$isDestroyed = true;
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
    const stageMeta = this.stage?.meta;
    return {
      name: "serverSceneMeta",
      stageName: stageMeta?.stageName,
      stageSystemName: stageMeta?.stageSystemName,
      stageAuthor: stageMeta?.author,
      gridSize: stageMeta?.gridSize,
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
    stageNames?: string[],
    stageLoader?: IStageLoader,
    propFactoryMethod?: (scene: IScene, stage: StageExt) => void,
    scheduler?: Scheduler,
    querier?: DBQuerier
  ) {
    this.initState();
    this.stageNames = stageNames;
    this.stageLoader = stageLoader;

    this.internalEventHandlerMap = {
      spawnControlledProp: this.spawnControlledPropHandler,
      spawnProp: this.spawnPropHandler,
      destroyProp: this.destroyPropHandler,
      destroyControlledProp: this.destroyControlledPropHandler,
      clientAction: this.clientActionHandler,
      animateProp: this.animatePropHandler,
    };
    this.propMap = propMap;
    this.propFactoryMethod = propFactoryMethod;
    this.scheduler = scheduler;
    this.querier = querier;
    this.loadStage(pickRandom(stageNames));
  }
  destructor() {
    clearTimeout(this.stageTimerID);
  }
}

// todo this is implementation dependant, needs to be moved out of this file
const layoutMap: Partial<Record<ITileSymbols, ILayoutTile>> = {
  "=": {
    solidity: "semi",
  },
  " ": {
    solidity: "ghost",
  },
};
