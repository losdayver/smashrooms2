import {
  IExternalEventBatch,
  IScene,
  ISceneSubscriber,
} from "../scene/sceneTypes";
import {
  IClientActionMessageExt,
  IConnectResponseMessageExt,
  IDisconnectMessageExt,
  IGenericMessageExt,
  IMessageExt,
} from "../../../../types/messages";
import { ICommunicator, ICommunicatorSubscriber } from "./communicatorTypes";
import { ClientID } from "../commonTypes";

export class Communicator implements ICommunicator {
  private scene: IScene;
  private sendMessageToSubscriber: ICommunicatorSubscriber["onReceiveMessageFromCommunicator"];

  subscribe = (subscriber: ICommunicatorSubscriber) => {
    this.sendMessageToSubscriber = subscriber.onReceiveMessageFromCommunicator;
  };
  onReceiveMessageFromScene: ISceneSubscriber["onReceiveMessageFromScene"] = (
    message,
    clientID?
  ) => {
    this.sendMessageToSubscriber(message, clientID || "all");
  };
  processMessage = (
    from: ClientID,
    msg:
      | IConnectResponseMessageExt
      | IDisconnectMessageExt
      | IClientActionMessageExt
      | IGenericMessageExt
  ) => {
    if (msg.name == "connRes") {
      this.scene.connectAction(
        from,
        (msg as IConnectResponseMessageExt).nameTag
      );
    } else if (msg.name == "disc") {
      this.scene.disconnectAction(from);
    } else if (msg.name == "clientAct") {
      this.scene.clientAction(from, msg.data.code, msg.data.status);
    } else if (msg.name == "clientAct") {
      this.scene.clientAction(from, msg.data.code, msg.data.status);
    }
  };

  processMessageSync: ICommunicator["processMessageSync"] = (msg) => {
    if (msg.name == "clientSceneMeta") {
      return this.scene.getSceneMeta();
    }
  };

  constructor(scene: IScene) {
    this.scene = scene;
  }
}
