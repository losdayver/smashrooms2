import { ISceneEvents, ISceneClient, IScene } from "../scene/sceneTypes";
import { ICommunicatior, ICommunicatorSubscriber } from "./communicatorTypes";

export class Communicatior implements ICommunicatior {
  private scene: IScene;
  private eventHandler: ICommunicatorSubscriber["handlerForCommunicatorEvents"];

  makeSubscribe = (subscriber: ICommunicatorSubscriber) => {
    this.eventHandler = subscriber.handlerForCommunicatorEvents;
  };
  handlerForSceneEventsEvents = (
    event: ISceneEvents,
    sceneClientID: ISceneClient["ID"]
  ) => {
    // todo implement
  };
  processRequest: () => {};

  constructor(scene: IScene) {
    this.scene = scene;
  }
}
