import { IScene, ISceneSubscriber } from "../scene/sceneTypes";
import { IConnectResponseMessageExt } from "../../../../types/messages";
import { ICommunicator, ICommunicatorSubscriber } from "./communicatorTypes";

export class Communicator implements ICommunicator {
  private scene: IScene;
  private sendMessageToSubscriber: ICommunicatorSubscriber["onReceiveMessageFromCommunicator"];

  subscribe: ICommunicator["subscribe"] = (subscriber) => {
    this.sendMessageToSubscriber = subscriber.onReceiveMessageFromCommunicator;
  };
  onReceiveMessageFromScene: ISceneSubscriber["onReceiveMessageFromScene"] = (
    message,
    clientID?
  ) => {
    this.sendMessageToSubscriber(message, clientID || "all");
  };
  processMessage: ICommunicator["processMessage"] = (from, msg) => {
    if (msg.name == "connRes") {
      this.scene.connectAction(
        from,
        (msg as IConnectResponseMessageExt).nameTag
      );
    } else if (msg.name == "disc") this.scene.disconnectAction(from);
    else if (msg.name == "clientAct")
      this.scene.clientAction(from, msg.data.code, msg.data.status);
    else if (msg.name == "clientSceneMeta")
      this.sendMessageToSubscriber(this.scene.getSceneMeta(), from);
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
