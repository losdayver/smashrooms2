/**
 * @file contains types for messages that are exchanged between server and client
 * Implementation specific for smashrooms
 * @author Zhmelev Oleg
 */
import { IMessageExt } from "../types/messages";

export interface IScoreUpdateExt {
  name: "score";
  tag: string;
  unlist?: boolean;
  K?: number;
  D?: number;
}

export type SmshMessageTypeExt = IMessageExt | IScoreUpdateExt;
