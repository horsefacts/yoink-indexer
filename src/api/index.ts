import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { sql, desc, replaceBigInts } from "ponder";

import castOutPlayers from "../../data/cast_out_players.json";

const app = new Hono();

interface PlayerResult {
  address: string;
  username: string;
  tribe: string;
  yoinks: number;
}

app.get("/recent", async (c) => {
  const yoinks = await db
    .select()
    .from(schema.yoinks)
    .orderBy(desc(schema.yoinks.timestamp))
    .limit(10);
  return c.json(replaceBigInts(yoinks, (n) => String(n)));
});

app.get("/leaderboard", async (c) => {
  const leaderboard = await db
    .select({
      address: schema.yoinks.by,
      yoinks: sql<string>`count(${schema.yoinks.id})`,
    })
    .from(schema.yoinks)
    .groupBy(schema.yoinks.by)
    .orderBy(sql`count(${schema.yoinks.id}) DESC`)
    .limit(10);

  return c.json(leaderboard);
});

app.get("/leaderboard/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const allRankings = await db
    .select({
      address: schema.yoinks.by,
      yoinks: sql<string>`count(${schema.yoinks.id})`,
    })
    .from(schema.yoinks)
    .groupBy(schema.yoinks.by)
    .orderBy(sql`count(${schema.yoinks.id}) DESC`);

  const targetIndex = allRankings.findIndex(
    (rank) => rank.address?.toLowerCase() === address
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

app.get("/yoinks-since/:id", async (c) => {
  const id = c.req.param("id");

  const referenceYoink = await db
    .select()
    .from(schema.yoinks)
    .where(sql`${schema.yoinks.id} = ${id}`)
    .limit(1);

  if (!referenceYoink[0]) {
    return c.json([]);
  }

  const yoinks = await db
    .select()
    .from(schema.yoinks)
    .where(sql`${schema.yoinks.timestamp} > ${referenceYoink[0].timestamp}`)
    .orderBy(desc(schema.yoinks.timestamp));

  return c.json(replaceBigInts(yoinks, (n) => String(n)));
});

app.get("/castout", async (c) => {
  const individualCounts = await db
    .select({
      address: schema.yoinks.by,
      yoinks: sql<string>`count(${schema.yoinks.id})`,
    })
    .from(schema.yoinks)
    .where(
      sql`${schema.yoinks.timestamp} >= 1747242000 AND ${schema.yoinks.timestamp} < 1747278000`
    )
    .groupBy(schema.yoinks.by);

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
    if (address) {
      const playerInfo = addressToTribe.get(address.toLowerCase());
      if (playerInfo) {
        individualResults.push({
          address,
          username: playerInfo.username,
          tribe: playerInfo.tribe,
          yoinks: Number(yoinks),
        });

        const currentTribeTotal = tribeAggregates.get(playerInfo.tribe) || 0;
        tribeAggregates.set(playerInfo.tribe, currentTribeTotal + Number(yoinks));
      }
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

export default app;
