import { IScene, ISceneSubscriber } from "@server/game/scene/sceneTypes";
import {
  ICommunicator,
  ICommunicatorSubscriber,
} from "@server/game/communicator/communicatorTypes";
import { Player } from "@server/game/smsh/player";
import { DBQuerier } from "@server/db/dbQuerier";

export class Communicator implements ICommunicator {
  private scene: IScene;
  private querier: DBQuerier;
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

  processMessageWithResponse: ICommunicator["processMessageWithResponse"] =
    async (msg) => {
      if (msg.name == "clientSceneMeta") {
        return this.scene.getSceneMeta();
      } else if (msg.name == "webDBQuery")
        return await this.querier.makeQuery(msg.queryName, msg.params);
    };

  constructor(scene: IScene, querier: DBQuerier) {
    this.scene = scene;
    this.querier = querier;
  }
}
