import { IScene, ISceneSubscriber } from "../scene/sceneTypes";
import { ICommunicator, ICommunicatorSubscriber } from "./communicatorTypes";
import { Player } from "../smsh/player";

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
  processMessage: ICommunicator["processMessage"] = (from, msg, nameTag) => {
    if (msg.name == "connRes") {
      this.scene.connectAction(from, nameTag);
    } else if (msg.name == "disc") {
      Player.score.unlist(nameTag);
      this.scene.disconnectAction(from);
    } else if (msg.name == "clientAct")
      this.scene.clientAction(from, msg.data.code, nameTag, msg.data.status);
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
