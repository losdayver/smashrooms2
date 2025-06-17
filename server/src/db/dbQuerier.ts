import { Pool, PoolConfig } from "pg";

// todo make this more verbose
export type IDBRes<T extends object = object> = T[];

interface DBClient {
  query: (text: string, params?: any) => Promise<IDBRes>;
  release: () => void;
}

export abstract class DBQuerier<Params> {
  getClient: () => Promise<DBClient> | DBClient;
  getQueryText: (queryName: string) => string | string[];
  preProcessText?: (
    text: string | string[],
    params?: Params
  ) => string | string[];
  makeQuery = async (queryName: string, params?: Params) => {
    const text = this.getQueryText(queryName);
    if (!text) return [];
    const preprocessed = this.preProcessText?.(text, params) ?? text;
    const client = await this.getClient();
    let res: IDBRes = [];
    try {
      if (typeof preprocessed == "string")
        res.push(await client.query(preprocessed, params));
      else
        for (const t of preprocessed) res.push(await client.query(t, params));
      return res;
    } finally {
      client.release();
    }
  };
}

export class PGQuerier extends DBQuerier<object> {
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
  preProcessText = (text: string | string[], params?: object) => {
    if (!params) return text;
    const replaceParams = (text: string, params?: object) => {
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
    const query = async (text: string, params: object) => {
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
