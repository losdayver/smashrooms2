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
  makeQuery = async (queryName: string, params?: Params) => {
    const text = this.getQueryText(queryName);
    if (!text) return [];
    const client = await this.getClient();
    let res: IDBRes = [];
    try {
      if (typeof text == "string") res.push(await client.query(text, params));
      else for (const t of text) res.push(await client.query(t, params));
      return res;
    } finally {
      client.release();
    }
  };
}

export class PGQuerier extends DBQuerier<any> {
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

  getClient = async () => {
    const pgClient = await this.pool.connect();
    const query = async (text, params) => {
      // todo convert params object to array of numbers $1, $2
      const res = await pgClient.query(text, params);
      return res.rows[0] as IDBRes;
    };
    return {
      query,
      release: pgClient.release,
    };
  };

  // todo params preprocessing
  getQueryText = (queryName: string) => this[queryName]?.();

  qHelloWorld() {
    return "select 'Hello World!' hello, 'oh no!' no;";
  }
}
