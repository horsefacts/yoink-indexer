import { ponder } from "@/generated";
import { replaceBigInts } from "@ponder/utils";
import { sql, desc } from "drizzle-orm";
import castOutPlayers from "../../data/cast_out_players.json";

interface PlayerResult {
  address: string;
  username: string;
  tribe: string;
  yoinks: number;
}

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

  const end = Math.min(allRankings.length, targetIndex + 7);
  const start = Math.max(0, end - 10);

  const nearbyRankings = allRankings.slice(start, end).map((rank, i) => ({
    rank: start + i + 1,
    address: rank.address,
    yoinks: rank.yoinks,
  }));

  return c.json({
    targetRank: targetIndex + 1,
    rankings: nearbyRankings,
  });
});

ponder.get("/yoinks-since/:id", async (c) => {
  const id = c.req.param("id");

  const referenceYoink = await c.db
    .select()
    .from(c.tables.Yoink)
    .where(sql`${c.tables.Yoink.id} = ${id}`)
    .limit(1);

  if (!referenceYoink[0]) {
    return c.json([]);
  }

  const yoinks = await c.db
    .select()
    .from(c.tables.Yoink)
    .where(sql`${c.tables.Yoink.timestamp} > ${referenceYoink[0].timestamp}`)
    .orderBy(desc(c.tables.Yoink.timestamp));

  return c.json(replaceBigInts(yoinks, (v) => Number(v)));
});

ponder.get("/castout", async (c) => {
  const individualCounts = await c.db
    .select({
      address: c.tables.Yoink.by,
      yoinks: sql<number>`count(${c.tables.Yoink.id})`,
    })
    .from(c.tables.Yoink)
    .where(sql`${c.tables.Yoink.timestamp} >= 1734026400`)
    .groupBy(c.tables.Yoink.by);

  const addressToTribe = new Map(
    castOutPlayers.map((player) => [
      player.address.toLowerCase(),
      {
        tribe: player.tribe,
        username: player.username,
      },
    ])
  );

  const tribeAggregates = new Map<string, number>();
  const individualResults: PlayerResult[] = [];

  individualCounts.forEach(({ address, yoinks }) => {
    const playerInfo = addressToTribe.get(address.toLowerCase());
    if (playerInfo) {
      individualResults.push({
        address,
        username: playerInfo.username,
        tribe: playerInfo.tribe,
        yoinks,
      });

      const currentTribeTotal = tribeAggregates.get(playerInfo.tribe) || 0;
      tribeAggregates.set(playerInfo.tribe, currentTribeTotal + yoinks);
    }
  });

  const tribeResults = Array.from(tribeAggregates.entries())
    .map(([tribe, totalYoinks]) => ({
      tribe,
      totalYoinks,
    }))
    .sort((a, b) => b.totalYoinks - a.totalYoinks);

  const sortedIndividualResults = individualResults.sort(
    (a, b) => b.yoinks - a.yoinks
  );

  return c.json({
    players: sortedIndividualResults,
    tribes: tribeResults,
  });
});
