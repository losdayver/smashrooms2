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
} from "./sceneTypes";
import { Mutex, severityLog } from "./../../utils";
import { Prop, propsMap } from "./props";
import { IControlled } from "./propTypes";

export class Scene implements IScene {
  eventHandler: ISceneSubscriber["handlerForSceneEventsEvents"];

  private propList: Prop[] = [];
  internalEventQueueMutex = new Mutex<IInternalEvent[]>([]);
  private internalEventHandlerMap: Record<
    IInternalEvent["name"],
    (data: any) => void
  >;

  tick = async () => {
    const unlock = await this.internalEventQueueMutex.acquire();
    try {
      for (let i = 0; i < this.internalEventQueueMutex.value.length; i++) {
        const event = this.internalEventQueueMutex.value.pop();
        this.internalEventHandlerMap[event.name]?.(event.data);
      }
    } finally {
      unlock();
    }
  };
  spawnControlledPropHandler = (data: ISpawnControlledPropEvent["data"]) => {
    // todo test if prop exists and is controlled
    this.propList.unshift(new propsMap[data.propName](data.clientID));
    severityLog(
      `created new controlled prop ${data.propName} for ${data.clientID}`
    );
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
      spawnProp: () => undefined,
      destroyProp: this.destroyPropHandler,
      destroyControlledProp: this.destroyControlledPropHandler,
    };
  }
}
