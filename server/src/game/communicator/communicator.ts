import { IExternalEventBatch, IScene } from "../scene/sceneTypes";
import {
  IClientActionMessageExt,
  IConnectResponseMessageExt,
  IDisconnectMessageExt,
  IGenericMessageExt,
  IMessageExt,
} from "../../../../types/messages";
import { ICommunicatior, ICommunicatorSubscriber } from "./communicatorTypes";

export class Communicatior implements ICommunicatior {
  private scene: IScene;
  private eventHandler: ICommunicatorSubscriber["handlerForCommunicatorEvents"];

  makeSubscribe = (subscriber: ICommunicatorSubscriber) => {
    this.eventHandler = subscriber.handlerForCommunicatorEvents;
  };
  handlerForSceneExternalEvents = (
    event: any,
    clientID: string,
    messageName?: IMessageExt["name"]
  ) => {
    if (!messageName || messageName == "scene")
      // todo this is ugly! needs to be standardized
      this.eventHandler({ name: "scene", data: event }, clientID);
    else this.eventHandler(event, clientID);
  };
  processMessage = (
    msg:
      | IConnectResponseMessageExt
      | IDisconnectMessageExt
      | IClientActionMessageExt
      | IGenericMessageExt
  ) => {
    if (msg.name == "connRes") {
      this.scene.connectAction(
        msg.clientID,
        (msg as IConnectResponseMessageExt).nameTag
      );
    } else if (msg.name == "disc") {
      this.scene.disconnectAction(msg.clientID);
    } else if (msg.name == "clientAct") {
      this.scene.clientAction(msg.clientID, msg.data.code, msg.data.status);
    } else if (msg.name == "clientAct") {
      this.scene.clientAction(msg.clientID, msg.data.code, msg.data.status);
    }
  };

  processMessageSync: ICommunicatior["processMessageSync"] = (msg) => {
    if (msg.name == "clientSceneMeta") {
      return this.scene.getSceneMeta();
    }
  };

  constructor(scene: IScene) {
    this.scene = scene;
  }
}
