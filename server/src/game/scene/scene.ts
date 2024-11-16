import { ClientActionCodes } from "../sockets/messageMeta";
import {
  IScene,
  ISceneActions,
  ISceneClient,
  ISceneSubscriber,
} from "./sceneTypes";
import { severityLog } from "./../../utils";

export class Scene implements IScene {
  eventHandler: ISceneSubscriber["handlerForSceneEventsEvents"];

  tick: () => void;
  clientAction = (clientID: ISceneClient["ID"], code: ClientActionCodes) => {
    severityLog(`client ${clientID} preformed action ${code}`);
  };
  connectAction = (clientID: ISceneClient["ID"]) => {
    severityLog(`scene connected client ${clientID}`);
  };
  disconnectAction = (clientID: ISceneClient["ID"]) => {
    severityLog(`scene disconnected client ${clientID}`);
  };

  makeSubscribe = (subscriber: ISceneSubscriber) => {
    this.eventHandler = subscriber.handlerForSceneEventsEvents;
  };
}
