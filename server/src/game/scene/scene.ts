import { ClientActionCodes } from "../sockets/messageMeta";
import {
  IDestroyControlledPropEvent,
  IDestroyPropEvent,
  IInternalEvent,
  IScene,
  ISceneActions,
  ISceneClient,
  ISceneSubscriber,
  ISpawnControlledPropEvent,
  ISpawnPropEvent,
} from "./sceneTypes";
import { Mutex, severityLog } from "./../../utils";
import { Prop, propsMap } from "./props";
import { IControlled } from "./propTypes";

export class Scene implements IScene {
  eventHandler: ISceneSubscriber["handlerForSceneEventsEvents"];

  private propList: Prop[] = [];
  private internalEventQueueMutex = new Mutex<IInternalEvent[]>([]);
  private internalEventHandlerMap: Record<
    IInternalEvent["name"],
    (data: any) => void
  >;

  tick = async () => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      console.log(this.internalEventQueueMutex.value);
      console.log(this.propList);
      while (this.internalEventQueueMutex.value.length) {
        const event = this.internalEventQueueMutex.value.pop();
        this.internalEventHandlerMap[event.name]?.(event.data);
      }
    } finally {
      unlock();
    }
  };
  spawnPropHandler = (data: ISpawnPropEvent["data"]) => {
    const propType = propsMap[data.propName];
    if (propType) {
      this.propList.unshift(new propType() as Prop);
      severityLog(`created new prop ${data.propName}`);
    }
  };
  spawnControlledPropHandler = (data: ISpawnControlledPropEvent["data"]) => {
    const propType = propsMap[data.propName];
    if (propType) {
      const prop = new propsMap[data.propName](data.clientID) as Prop;
      if ((prop as unknown as IControlled).controlled) {
        this.propList.unshift(prop);
        severityLog(
          `created new controlled prop ${data.propName} for ${data.clientID}`
        );
      }
    }
  };
  destroyPropHandler = (data: IDestroyPropEvent["data"]) => {
    for (let i = 0; i < this.propList.length; i++) {
      if (this.propList[i].ID == data.ID) {
        this.propList.splice(i, 1);
      }
      severityLog(`destroyed prop ${this.propList[i].ID}`);
      return;
    }
  };
  destroyControlledPropHandler = (
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
        this.propList.splice(i, 1);
      }
      return;
    }
  };

  clientAction = (clientID: ISceneClient["ID"], code: ClientActionCodes) => {
    severityLog(`client ${clientID} preformed action ${code}`);
  };
  connectAction = async (clientID: ISceneClient["ID"]) => {
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
    }
  };
  disconnectAction = async (clientID: ISceneClient["ID"]) => {
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

  makeSubscribe = (subscriber: ISceneSubscriber) => {
    this.eventHandler = subscriber.handlerForSceneEventsEvents;
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
