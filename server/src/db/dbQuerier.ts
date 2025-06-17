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
