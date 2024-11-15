import {
  ICommunicatior,
  ICommunicatorClient,
  ICommunicatorEvent,
} from "../communicator/communicatorTypes";
import { ISocketServer } from "./socketsTypes";

export class WSSocketServer implements ISocketServer {
  private communicator: ICommunicatior;
  constructor(communicator: ICommunicatior) {
    this.communicator = communicator;
  }
  handlerForCommunicatorEvents: (
    event: ICommunicatorEvent,
    sceneClientID: ICommunicatorClient["ID"]
  ) => void;
}
