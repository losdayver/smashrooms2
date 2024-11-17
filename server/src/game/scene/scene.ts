import { ClientActionCodes } from "../sockets/messageMeta";
import {
  IInternalEvent,
  IScene,
  ISceneActions,
  ISceneClient,
  ISceneSubscriber,
  ISpawnControlledPropEvent,
} from "./sceneTypes";
import { severityLog } from "./../../utils";
import { Prop, propsMap } from "./props";

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
      `created new controlled prop ${data.propName} for data.clientID`
    );
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
    severityLog(`scene disconnected client ${clientID}`);
  };

  makeSubscribe = (subscriber: ISceneSubscriber) => {
    this.eventHandler = subscriber.handlerForSceneEventsEvents;
  };

  constructor() {
    this.internalEventHandlerMap = {
      spawnControlledProp: this.spawnControlledPropHandler,
      spawnProp: () => undefined,
    };
  }
}
