import { IExternalEvent, IScene } from "../scene/sceneTypes";
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
  handlerForSceneExternalEvents = (event: IExternalEvent, clientID: string) => {
    this.eventHandler(event, clientID);
  };
  processMessage = (
    msg:
      | IConnectResponseMessage
      | IDisconnectMessage
      | IClientActionMessage
      | IGenericMessage
  ) => {
    if (msg.name == "connRes") {
      this.scene.connectAction(
        msg.clientID,
        (msg as IConnectResponseMessage).nameTag
      );
    } else if (msg.name == "disc") {
      this.scene.disconnectAction(msg.clientID);
    } else if (msg.name == "clientAct") {
      this.scene.clientAction(msg.clientID, msg.data.code, msg.data.status);
    }
  };

  constructor(scene: IScene) {
    this.scene = scene;
  }
}
