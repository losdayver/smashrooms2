export interface IConnectionMessage {
  name: "conn";
  clientName: string;
}
export interface IGenericMessage {
  name: "string";
  data: any;
}
