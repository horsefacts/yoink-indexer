import { onchainTable } from "ponder";

export const yoinks = onchainTable("yoinks", (t) => ({
  id: t.text().primaryKey(),
  timestamp: t.bigint(),
  by: t.hex(),
  from: t.hex(),
}));
