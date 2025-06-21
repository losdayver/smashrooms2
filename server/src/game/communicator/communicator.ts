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
    switch (msg.name) {
      case "connRes":
        this.scene.connectAction(from, nameTag);
        break;
      case "disc":
        Player.score.unlist(nameTag);
        this.scene.disconnectAction(from);
        break;
      case "clientAct":
        this.scene.clientAction(from, msg.data.code, nameTag, msg.data.status);
    }
  };

  processMessageWithResponse: ICommunicator["processMessageWithResponse"] =
    async (msg) => {
      switch (msg.name) {
        case "clientSceneMeta":
          return this.scene.getSceneMeta();
        case "webDBQuery":
          return await this.querier.makeQuery({
            queryName: msg.queryName,
            params: msg.params,
          });
      }
    };

  constructor(scene: IScene, querier: DBQuerier) {
    this.scene = scene;
    this.querier = querier;
  }
}
