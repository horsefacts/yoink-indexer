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

ponder.get("/leaderboard/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const allRankings = await c.db
    .select({
      address: c.tables.Yoink.by,
      yoinks: sql<number>`count(${c.tables.Yoink.id})`,
    })
    .from(c.tables.Yoink)
    .groupBy(c.tables.Yoink.by)
    .orderBy(sql`count(${c.tables.Yoink.id}) DESC`);

  const targetIndex = allRankings.findIndex(
    (rank) => rank.address.toLowerCase() === address
  );

  if (targetIndex === -1) {
    return c.json({
      targetRank: null,
      rankings: [],
    });
  }

  const start = Math.max(0, targetIndex - 5);
  const end = Math.min(allRankings.length, start + 10);

  const adjustedStart = Math.max(0, end - 10);

  const nearbyRankings = allRankings
    .slice(adjustedStart, end)
    .map((rank, i) => ({
      rank: adjustedStart + i + 1,
      address: rank.address,
      yoinks: rank.yoinks,
    }));

  return c.json({
    targetRank: targetIndex + 1,
    rankings: nearbyRankings,
  });
});
