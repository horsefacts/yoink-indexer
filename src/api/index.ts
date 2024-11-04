import { ponder } from "@/generated";
import { replaceBigInts } from "@ponder/utils";
import { sql, desc } from "drizzle-orm";

ponder.get("/recent", async (c) => {
  const yoinks = await c.db
    .select()
    .from(c.tables.Yoink)
    .orderBy(desc(c.tables.Yoink.timestamp))
    .limit(10);
  return c.json(replaceBigInts(yoinks, (v) => Number(v)));
});

ponder.get("/leaderboard", async (c) => {
  const leaderboard = await c.db
    .select({
      address: c.tables.Yoink.by,
      yoinks: sql<number>`count(${c.tables.Yoink.id})`,
    })
    .from(c.tables.Yoink)
    .groupBy(c.tables.Yoink.by)
    .orderBy(sql`count(${c.tables.Yoink.id}) DESC`)
    .limit(10);

  return c.json(leaderboard);
});
