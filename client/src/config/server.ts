import { LSConfig } from "@client/config/base";

export class ServerConfig extends LSConfig<ServerConfigObjType> {
  static instance: ServerConfig;
  protected getDefaultObj = () => defaultServerConfigObj;

  constructor() {
    super("serverSettings");
    if (!ServerConfig.instance) ServerConfig.instance = this;
    return ServerConfig.instance;
  }
}

const WS_DEFAULT_PORT = 5889;

export const defaultServerConfigObj: ServerConfigObjType = {
  host: window.location.hostname,
  port: WS_DEFAULT_PORT,
};

type ServerConfigObjType = {
  host: string;
  port: number;
};
