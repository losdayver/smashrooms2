export type ClientID = string;

export interface IDestructible {
  destructor: () => void;
}
