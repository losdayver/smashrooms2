import { Pool } from "pg";
import { DBQuerier, IDBRes } from "./dbQuerier";
import { env } from "@server/env";

type IPGParams = Record<string, any>;
export type IPGQueryNames = keyof typeof queryStorage;

const pool: Pool = new Pool(env.dbConfig.postgres);
export class PGQuerier extends DBQuerier<IPGParams> {
  /** replaces entries like $id with $1 etc for postgres compatibility */
  protected preProcessText = (text: string | string[], params?: IPGParams) => {
    if (!params) return text;
    const replaceParams = (text: string, params?: IPGParams) => {
      Object.keys(params).forEach(
        (key, index) => (text = text.replaceAll(`$${key}`, `$${index + 1}`))
      );
      return text;
    };
    if (typeof text == "string") {
      return replaceParams(text, params);
    } else return text.map((text) => replaceParams(text, params));
  };

  protected getClient = async () => {
    const pgClient = await pool.connect();
    const query = async (text: string, params: IPGParams) => {
      let paramsArray: any[];
      if (params) paramsArray = Object.values(params);
      const res = await pgClient.query(text, paramsArray);
      return res.rows as IDBRes;
    };
    return {
      query,
      release: pgClient.release,
    };
  };

  protected getQueryText = async (queryName: string, params: IPGParams) =>
    await queryStorage[queryName]?.(params, this);
}

const queryStorage = {
  qHelloWorld() {
    return "select 'Hello World!' value";
  },
  qTopScoresByTag(params: { limit: number }) {
    if (params.limit > 20) return;
    return "select * from top_scores_by_tag order by pk desc limit $limit";
  },
  async qHelloWorld1(_, q: PGQuerier) {
    const res = await q.makeQuery("qHelloWorld");
    return res.map((row: any) => ({ ...row, value: row.value + "123" }));
  },
} as const;
