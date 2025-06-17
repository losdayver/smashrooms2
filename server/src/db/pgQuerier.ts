import { Pool, PoolConfig } from "pg";
import { DBQuerier, IDBRes } from "./dbQuerier";

type IPGParams = Record<string, any>;

export class PGQuerier extends DBQuerier<IPGParams> {
  private pool: Pool;

  constructor(config?: PoolConfig) {
    super();
    // todo pull config from .env/
    this.pool = new Pool(
      config ?? {
        host: "localhost",
        user: "postgres",
        password: "postgres",
        database: "smshDB",
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        maxLifetimeSeconds: 60,
      }
    );
  }

  /** replaces entries like $id with $1 etc for postgres compatibility */
  preProcessText = (text: string | string[], params?: IPGParams) => {
    if (!params) return text;
    const replaceParams = (text: string, params?: IPGParams) => {
      Object.keys(params).forEach(
        (key, index) => (text = text.replaceAll(`$${key}`, `$${index + 1}`))
      );
      return text;
    };
    if (typeof text == "string") {
      console.log(replaceParams(text, params));

      return replaceParams(text, params);
    } else return text.map((text) => replaceParams(text, params));
  };

  getClient = async () => {
    const pgClient = await this.pool.connect();
    const query = async (text: string, params: IPGParams) => {
      let paramsArray: any[];
      if (params) paramsArray = Object.values(params);
      const res = await pgClient.query(text, paramsArray);
      return res.rows[0] as IDBRes;
    };
    return {
      query,
      release: pgClient.release,
    };
  };

  getQueryText = (queryName: string) => this[queryName]?.();

  qHelloWorld() {
    return "select 'Hello World!' value";
  }
  qTopScoresByTag() {
    return "select * from top_scores_by_tag order by pk desc limit $limit";
  }
}
