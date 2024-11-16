import { ISceneEvents, ISceneClient, IScene } from "../scene/sceneTypes";
import {
  IClientActionMessage,
  IConnectResponseMessage,
  IDisconnectMessage,
  IGenericMessage,
} from "../sockets/messageMeta";
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
  processMessage = (
    msg:
      | IConnectResponseMessage
      | IDisconnectMessage
      | IClientActionMessage
      | IGenericMessage
  ) => {
    if (msg.name == "connRes") {
      this.scene.connectAction(msg.clientID);
    } else if (msg.name == "disc") {
      this.scene.disconnectAction(msg.clientID);
    } else if (msg.name == "clientAct") {
      this.scene.clientAction(msg.clientID, msg.data.code);
    }
  };

  constructor(scene: IScene) {
    this.scene = scene;
  }
}
