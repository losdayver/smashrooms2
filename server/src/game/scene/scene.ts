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
import { severityLog } from "./../../utils";
import { Prop, propsMap } from "./props";
import { IControlled } from "./propTypes";

export class Scene implements IScene {
  eventHandler: ISceneSubscriber["handlerForSceneEventsEvents"];

  private propList: Prop[] = [];
  private internalEventQueue: IInternalEvent[] = [];
  private internalEventHandlerMap: Record<
    IInternalEvent["name"],
    (data: any) => void
  >;

  tick = () => {
    const queueSnapshot = [...this.internalEventQueue];
    this.internalEventQueue = [];
    for (let i = 0; i < queueSnapshot.length; i++) {
      const event = queueSnapshot.pop();
      this.internalEventHandlerMap[event.name]?.(event.data);
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
  connectAction = (clientID: ISceneClient["ID"]) => {
    severityLog(`scene connected client ${clientID}`);
    this.internalEventQueue.unshift({
      name: "spawnControlledProp",
      data: {
        clientID,
        posX: 0,
        posY: 0,
        propName: "player",
      },
    });
  };
  disconnectAction = (clientID: ISceneClient["ID"]) => {
    this.internalEventQueue.unshift({
      name: "destroyControlledProp",
      data: { clientID },
    });
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
