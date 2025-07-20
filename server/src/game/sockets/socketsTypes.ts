import { ICommunicatorSubscriber } from "@server/game/communicator/communicatorTypes";
import { IDestructible } from "../commonTypes";

export interface ISocketServer extends ICommunicatorSubscriber, IDestructible {}
