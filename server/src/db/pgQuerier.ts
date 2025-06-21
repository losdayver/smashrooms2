import { Pool } from "pg";
import { DBQuerier, IDBRes, IQueryConfig } from "./dbQuerier";
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

  protected getQueryText = async (queryConfig: IQueryConfig<IPGParams>) =>
    await queryStorage[queryConfig.queryName]?.(queryConfig, this);
}

const queryStorage: Record<
  string,
  (
    queryConfig: IQueryConfig<IPGParams>,
    q: PGQuerier
  ) => Promise<string | string[] | IDBRes> | string | string[] | IDBRes
> = {
  async qHelloWorld1(conf, q) {
    const res = await q.makeQuery({
      queryName: "qHelloWorld",
    });
    return res.map((row: any) => ({ ...row, value: row.value + "123" }));
  },
  qTopScoresByTag(conf) {
    if (conf.params.limit > 20) return;
    return "select * from top_scores_by_tag order by kills desc limit $limit";
  },
  qUpsertTopScore(conf) {
    if (conf.params.target == "client") return;
    return `
    insert into top_scores_by_tag (tag, kills) 
    values ($tag, $kills)
    on conflict (tag) 
    do update set 
    kills = greatest(top_scores_by_tag.kills, excluded.kills)`;
  },
} as const;
