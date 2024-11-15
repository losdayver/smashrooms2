import { ISceneEvents, ISceneClient, IScene } from "../scene/sceneTypes";
import { ICommunicatior, ICommunicatorSubscriber } from "./communicatorTypes";

export class Communicatior implements ICommunicatior {
  private scene: IScene;

  makeSubscribe: (communiucatorSubscriber: ICommunicatorSubscriber) => void;
  handlerForSceneEventsEvents: (
    event: ISceneEvents,
    sceneClientID: ISceneClient["ID"]
  ) => void;
  makeEventSubscribtion: (
    communiucatorSubscriber: ICommunicatorSubscriber
  ) => void;
  processRequest: () => {};

  constructor(scene: IScene) {
    this.scene = scene;
  }
}
