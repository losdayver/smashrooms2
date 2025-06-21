export type IDBRes<T extends object = object> = T[];

interface DBClient {
  query: (text: string, params?: object) => Promise<IDBRes>;
  release: () => void;
}
export interface IQueryConfig<Params = any> {
  /** name of the query */
  queryName: string;
  /** origin of the query (client is chosen by default) */
  target?: "client" | "server";
  /** parameters for parametrized queries */
  params?: Params;
}

export abstract class DBQuerier<Params extends object = object> {
  protected getClient: () => Promise<DBClient> | DBClient;
  /** returns text for a query or the result itself for complex scenarios  */
  protected getQueryText: (
    queryConfig: IQueryConfig<Params>
  ) => Promise<string | string[] | IDBRes> | string | string[] | IDBRes;
  protected preProcessText?: (
    text: string | string[],
    params?: Params
  ) => string | string[];
  makeQuery = async (queryConfig: IQueryConfig<Params>) => {
    const { params } = queryConfig;
    let text: string | IDBRes<object> | string[];
    try {
      text = await this.getQueryText({ target: "client", ...queryConfig });
    } catch (e) {
      console.error(e);
    }
    if (!text) return [];
    // if instance of IDBRes is returned
    else if (typeof text == "object") return text as IDBRes;
    const preprocessed = this.preProcessText?.(text, params) ?? text;
    const client = await this.getClient();
    let res: IDBRes = [];
    try {
      if (typeof preprocessed == "string")
        res = await client.query(preprocessed, params);
      else
        for (const t of preprocessed) res.push(await client.query(t, params));
      return res;
    } catch (e) {
      console.error(e);
    } finally {
      client?.release();
    }
  };
}
