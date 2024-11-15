import {
  ClientActionCodes,
  IScene,
  ISceneActions,
  ISceneClient,
  ISceneSubscriber,
} from "./sceneTypes";

export class Scene implements IScene {
  eventHandler: ISceneSubscriber["handlerForSceneEventsEvents"];

  tick: () => void;
  clientAction: (code: ClientActionCodes) => void;
  connectAction: (clientID: ISceneClient["ID"]) => void;
  disconnectAction: (clientID: ISceneClient["ID"]) => void;
  recieveAction: (action: ISceneActions) => void;

  makeSubscribe = (subscriber: ISceneSubscriber) => {
    this.eventHandler = subscriber.handlerForSceneEventsEvents;
  };
}
